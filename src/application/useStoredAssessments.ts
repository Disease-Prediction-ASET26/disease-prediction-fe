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
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    key: string;
    attempt: number;
    load: typeof load;
    state: LoadState<T>;
  }>({ key, attempt, load, state: { status: 'loading' } });

  useEffect(() => {
    let active = true;
    setSnapshot({ key, attempt, load, state: { status: 'loading' } });
    Promise.resolve()
      .then(load)
      .then(
        (data) => {
          if (active) setSnapshot({ key, attempt, load, state: { status: 'success', data } });
        },
        (error: unknown) => {
          if (!active) return;
          const notFound =
            typeof error === 'object' &&
            error !== null &&
            (error as { kind?: unknown }).kind === 'not-found';
          setSnapshot({
            key,
            attempt,
            load,
            state: { status: 'error', message: messageOf(error), notFound },
          });
        },
      );
    return () => {
      active = false;
    };
  }, [key, attempt, load]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const state =
    snapshot.key === key && snapshot.attempt === attempt && snapshot.load === load
      ? snapshot.state
      : { status: 'loading' as const };
  return { state, reload };
}

/** The signed-in patient's stored assessments, newest first (`GET /api/assessments`). */
export function useAssessmentList() {
  const client = useAssessmentApiClient();
  const load = useCallback(() => client.listAssessments(), [client]);
  return useLoad<AssessmentSummary[]>(load, 'list');
}

/** One stored assessment (`GET /api/assessments/{id}`). */
export function useAssessmentDetail(assessmentId: string) {
  const client = useAssessmentApiClient();
  const load = useCallback(() => client.getAssessment(assessmentId), [assessmentId, client]);
  return useLoad<AssessmentDetail>(load, assessmentId);
}
