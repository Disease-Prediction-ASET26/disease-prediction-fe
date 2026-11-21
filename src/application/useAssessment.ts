import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssessmentApiClient } from '../api/AssessmentApiClient';
import { useAssessmentApiClient } from '../api/AssessmentApiContext';
import type { AssessmentError } from '../api/errors';
import {
  ApiProblemError,
  NetworkError,
  UnrecognizedSymptomsError,
  ValidationError,
} from '../api/errors';
import type { AssessmentRequest, AssessmentResponse, SymptomEntry } from '../domain/assessment';
import { hasAnySymptomSignal } from '../domain/assessment';

export type AssessmentStatus = 'idle' | 'loading' | 'success' | 'error';

/** What the form collects; the hook turns it into the wire `AssessmentRequest`. */
export interface AssessmentInput {
  freeText: string;
  symptomEntries: SymptomEntry[];
  patientId?: string | null;
}

/** Builds the contract payload. Free text is sent as typed (trimmed); the backend parses it. */
export function buildAssessmentRequest(input: AssessmentInput): AssessmentRequest {
  return {
    patientId: input.patientId ?? null,
    freeText: input.freeText.trim(),
    symptomEntries: input.symptomEntries.map((entry) => ({ ...entry })),
  };
}

export interface UseAssessmentResult {
  status: AssessmentStatus;
  data: AssessmentResponse | null;
  error: AssessmentError | null;
  /** Resolves with the response on success, or `null` if nothing was sent or the call failed. */
  submit: (input: AssessmentInput) => Promise<AssessmentResponse | null>;
  /**
   * Answer the current follow-up question (true = yes, false = no). Accumulates the answered
   * symptom into the confirmed/denied sets and re-predicts. No-op if there is no pending question.
   */
  answerFollowUp: (present: boolean) => Promise<AssessmentResponse | null>;
  reset: () => void;
}

/**
 * Application layer for the assessment feature (counterpart of the backend's
 * `AssessmentApiService`): validates the input, builds the request, calls the
 * `AssessmentApiClient` port and exposes a small status machine to the view.
 *
 * It also drives the adaptive follow-up loop (FR-P3): when a result carries
 * `needsFollowUp`, the view shows the question and calls `answerFollowUp`; the hook carries the
 * confirmed/denied symptom sets across turns (the server is stateless) until the result no longer
 * needs a follow-up.
 */
export function useAssessment(clientOverride?: AssessmentApiClient): UseAssessmentResult {
  const contextClient = useAssessmentApiClient();
  const client = clientOverride ?? contextClient;

  const [status, setStatus] = useState<AssessmentStatus>('idle');
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<AssessmentError | null>(null);

  // Only the latest submission may update state; also ignores responses after unmount.
  const latestRequestId = useRef(0);
  // Accumulated follow-up loop state (stateless server; the client carries it).
  const confirmedSymptoms = useRef<string[]>([]);
  const deniedSymptoms = useRef<string[]>([]);
  const roundsUsed = useRef(0);
  useEffect(() => {
    return () => {
      latestRequestId.current = -1;
    };
  }, []);

  // Keep the confirmed set in sync with the server's view of active symptoms, so a yes/no answer
  // is appended to the right baseline even on the first turn.
  const seedFollowUpState = useCallback((response: AssessmentResponse) => {
    const active = response.result?.activeSymptoms;
    if (active && active.length > 0) {
      confirmedSymptoms.current = [...active];
    }
  }, []);

  const submit = useCallback(
    async (input: AssessmentInput): Promise<AssessmentResponse | null> => {
      const request = buildAssessmentRequest(input);
      if (!hasAnySymptomSignal(request)) {
        setStatus('error');
        setData(null);
        setError(new ValidationError());
        return null;
      }

      const requestId = ++latestRequestId.current;
      // A new assessment resets the follow-up loop.
      confirmedSymptoms.current = [];
      deniedSymptoms.current = [];
      roundsUsed.current = 0;
      setStatus('loading');
      setError(null);

      try {
        const response = await client.submitAssessment(request);
        if (requestId !== latestRequestId.current) return null;
        seedFollowUpState(response);
        setData(response);
        setStatus('success');
        return response;
      } catch (caught) {
        if (requestId !== latestRequestId.current) return null;
        setData(null);
        setError(toAssessmentError(caught));
        setStatus('error');
        return null;
      }
    },
    [client, seedFollowUpState],
  );

  const answerFollowUp = useCallback(
    async (present: boolean): Promise<AssessmentResponse | null> => {
      const followUp = data?.result?.followUp;
      if (!data?.result?.needsFollowUp || !followUp) {
        return null;
      }

      const requestId = ++latestRequestId.current;
      setStatus('loading');
      setError(null);

      try {
        const response = await client.submitFollowUp({
          assessmentId: data.assessmentId,
          confirmedSymptoms: confirmedSymptoms.current,
          deniedSymptoms: deniedSymptoms.current,
          answer: { symptom: followUp.symptom, present },
          roundsUsed: roundsUsed.current,
        });
        if (requestId !== latestRequestId.current) return null;
        // Mirror the merge the server performs, so the next turn carries it.
        roundsUsed.current += 1;
        if (present) {
          confirmedSymptoms.current = [...confirmedSymptoms.current, followUp.symptom];
        } else {
          deniedSymptoms.current = [...deniedSymptoms.current, followUp.symptom];
        }
        seedFollowUpState(response);
        setData(response);
        setStatus('success');
        return response;
      } catch (caught) {
        if (requestId !== latestRequestId.current) return null;
        setData(null);
        setError(toAssessmentError(caught));
        setStatus('error');
        return null;
      }
    },
    [client, data, seedFollowUpState],
  );

  const reset = useCallback(() => {
    latestRequestId.current += 1;
    confirmedSymptoms.current = [];
    deniedSymptoms.current = [];
    roundsUsed.current = 0;
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return { status, data, error, submit, answerFollowUp, reset };
}

/** Map an unknown thrown value to the narrow `AssessmentError` union the view understands. */
function toAssessmentError(caught: unknown): AssessmentError {
  return caught instanceof ValidationError ||
    caught instanceof UnrecognizedSymptomsError ||
    caught instanceof NetworkError ||
    caught instanceof ApiProblemError
    ? caught
    : new NetworkError();
}
