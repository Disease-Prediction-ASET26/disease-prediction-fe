import { useCallback, useEffect, useState } from 'react';
import { useAssessmentApiClient } from '../api/AssessmentApiContext';
import type { AssessmentDetail, AssessmentSummary } from '../domain/history';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'success'; data: T };

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

/** Loads a resource once per `key`, ignoring responses that arrive after the key changed. */
function useLoad<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (data) => {
        if (active) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (!active) return;
        const notFound =
          typeof error === 'object' &&
          error !== null &&
          (error as { kind?: unknown }).kind === 'not-found';
        setState({ status: 'error', message: messageOf(error), notFound });
      },
    );
    return () => {
      active = false;
    };
    // `load` is rebuilt every render; `key` and `attempt` decide when to reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, reload };
}

/** The signed-in patient's stored assessments, newest first (`GET /api/assessments`). */
export function useAssessmentList() {
  const client = useAssessmentApiClient();
  return useLoad<AssessmentSummary[]>(() => client.listAssessments(), 'list');
}

/** One stored assessment (`GET /api/assessments/{id}`). */
export function useAssessmentDetail(assessmentId: string) {
  const client = useAssessmentApiClient();
  return useLoad<AssessmentDetail>(() => client.getAssessment(assessmentId), assessmentId);
}
