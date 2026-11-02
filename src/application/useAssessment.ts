import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssessmentApiClient } from '../api/AssessmentApiClient';
import { useAssessmentApiClient } from '../api/AssessmentApiContext';
import type { AssessmentError } from '../api/errors';
import { NetworkError, ValidationError } from '../api/errors';
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
  reset: () => void;
}

/**
 * Application layer for the assessment feature (counterpart of the backend's
 * `AssessmentApiService`): validates the input, builds the request, calls the
 * `AssessmentApiClient` port and exposes a small status machine to the view.
 */
export function useAssessment(clientOverride?: AssessmentApiClient): UseAssessmentResult {
  const contextClient = useAssessmentApiClient();
  const client = clientOverride ?? contextClient;

  const [status, setStatus] = useState<AssessmentStatus>('idle');
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<AssessmentError | null>(null);

  // Only the latest submission may update state; also ignores responses after unmount.
  const latestRequestId = useRef(0);
  useEffect(() => {
    return () => {
      latestRequestId.current = -1;
    };
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
      setStatus('loading');
      setError(null);

      try {
        const response = await client.submitAssessment(request);
        if (requestId !== latestRequestId.current) return null;
        setData(response);
        setStatus('success');
        return response;
      } catch (caught) {
        if (requestId !== latestRequestId.current) return null;
        const mapped =
          caught instanceof ValidationError || caught instanceof NetworkError
            ? caught
            : new NetworkError();
        setData(null);
        setError(mapped);
        setStatus('error');
        return null;
      }
    },
    [client],
  );

  const reset = useCallback(() => {
    latestRequestId.current += 1;
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return { status, data, error, submit, reset };
}
