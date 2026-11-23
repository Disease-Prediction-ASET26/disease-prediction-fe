import { act, renderHook, waitFor } from '@testing-library/react';
import type { AssessmentApiClient } from '../api/AssessmentApiClient';
import { NetworkError, ValidationError } from '../api/errors';
import type { AssessmentResponse } from '../domain/assessment';
import { predictionResponse } from '../test/mocks/fixtures';
import { buildAssessmentRequest, useAssessment } from './useAssessment';

const cough = { rawText: 'cough', severity: 'MILD', durationDays: 0, isMapped: true } as const;

function fakeClient(
  impl: AssessmentApiClient['submitAssessment'],
  followUpImpl?: AssessmentApiClient['submitFollowUp'],
): AssessmentApiClient {
  return {
    submitAssessment: vi.fn(impl),
    submitFollowUp: vi.fn(followUpImpl ?? (async () => predictionResponse)),
    listAssessments: vi.fn(async () => []),
    getAssessment: vi.fn(async () => {
      throw new Error('not used');
    }),
  };
}

describe('buildAssessmentRequest', () => {
  it('produces the contract payload with a null patientId by default', () => {
    expect(buildAssessmentRequest({ freeText: '  dry cough ', symptomEntries: [cough] })).toEqual({
      patientId: null,
      freeText: 'dry cough',
      symptomEntries: [{ rawText: 'cough', severity: 'MILD', durationDays: 0, isMapped: true }],
    });
  });
});

describe('useAssessment', () => {
  it('does not call the client when there is no symptom signal', async () => {
    const client = fakeClient(async () => predictionResponse);
    const { result } = renderHook(() => useAssessment(client));

    let response: unknown;
    await act(async () => {
      response = await result.current.submit({ freeText: '   ', symptomEntries: [] });
    });

    expect(response).toBeNull();
    expect(client.submitAssessment).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(ValidationError);
  });

  it('sends the built request and exposes the response on success', async () => {
    const client = fakeClient(async () => predictionResponse);
    const { result } = renderHook(() => useAssessment(client));

    await act(async () => {
      await result.current.submit({ freeText: 'headache', symptomEntries: [cough] });
    });

    expect(client.submitAssessment).toHaveBeenCalledWith({
      patientId: null,
      freeText: 'headache',
      symptomEntries: [cough],
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(predictionResponse);
    expect(result.current.error).toBeNull();
  });

  it('reports loading while the request is in flight', async () => {
    let resolve!: (value: typeof predictionResponse) => void;
    const client = fakeClient(() => new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useAssessment(client));

    act(() => {
      void result.current.submit({ freeText: 'cough', symptomEntries: [] });
    });
    expect(result.current.status).toBe('loading');

    await act(async () => resolve(predictionResponse));
    expect(result.current.status).toBe('success');
  });

  it.each([
    ['ValidationError', new ValidationError(), ValidationError],
    ['NetworkError', new NetworkError(), NetworkError],
    ['unknown error', new Error('boom'), NetworkError],
  ])('maps a rejected %s to the error state', async (_label, thrown, expected) => {
    const client = fakeClient(async () => {
      throw thrown;
    });
    const { result } = renderHook(() => useAssessment(client));

    await act(async () => {
      await result.current.submit({ freeText: 'cough', symptomEntries: [] });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(expected);
    expect(result.current.data).toBeNull();
  });

  it('ignores a stale response once a newer submission has started', async () => {
    const resolvers: Array<(value: typeof predictionResponse) => void> = [];
    const client = fakeClient(() => new Promise((r) => resolvers.push(r)));
    const { result } = renderHook(() => useAssessment(client));

    act(() => {
      void result.current.submit({ freeText: 'first', symptomEntries: [] });
      void result.current.submit({ freeText: 'second', symptomEntries: [] });
    });
    const second = { ...predictionResponse, assessmentId: 'second' };
    await act(async () => resolvers[1](second));
    await act(async () => resolvers[0](predictionResponse));

    await waitFor(() => expect(result.current.data?.assessmentId).toBe('second'));
  });

  it('reset returns to idle', async () => {
    const client = fakeClient(async () => predictionResponse);
    const { result } = renderHook(() => useAssessment(client));
    await act(async () => {
      await result.current.submit({ freeText: 'cough', symptomEntries: [] });
    });

    act(() => result.current.reset());

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
  });
});

describe('useAssessment follow-up loop', () => {
  const vague: AssessmentResponse = {
    assessmentId: 'a1',
    emergencyDetected: false,
    result: {
      resultId: 'r1',
      generatedAt: '2026-01-01T00:00:00Z',
      disclaimer: 'This is not a medical diagnosis.',
      predictions: [
        { rank: 1, probability: 0.48, diseaseName: 'Fungal infection', explanation: null },
      ],
      activeSymptoms: ['itching'],
      needsFollowUp: true,
      followUp: {
        symptom: 'nodal_skin_eruptions',
        question: 'Do you also have nodal skin eruptions?',
        topDisease: 'Fungal infection',
        confidence: 0.48,
      },
    },
  };

  const confident: AssessmentResponse = {
    assessmentId: 'a2',
    emergencyDetected: false,
    result: {
      resultId: 'r2',
      generatedAt: '2026-01-01T00:00:01Z',
      disclaimer: 'This is not a medical diagnosis.',
      predictions: [
        { rank: 1, probability: 0.97, diseaseName: 'Fungal infection', explanation: null },
      ],
      activeSymptoms: ['itching', 'nodal_skin_eruptions'],
      needsFollowUp: false,
      followUp: null,
    },
  };

  it('answering yes carries the confirmed symptoms and the answer to the client', async () => {
    const client = fakeClient(
      async () => vague,
      async () => confident,
    );
    const { result } = renderHook(() => useAssessment(client));

    await act(async () => {
      await result.current.submit({ freeText: 'itching', symptomEntries: [] });
    });
    expect(result.current.data?.result?.needsFollowUp).toBe(true);

    await act(async () => {
      await result.current.answerFollowUp(true);
    });

    // The stored assessment's id lets the backend (Iteration 7) update it in place.
    expect(client.submitFollowUp).toHaveBeenCalledWith({
      assessmentId: vague.assessmentId,
      confirmedSymptoms: ['itching'],
      deniedSymptoms: [],
      answer: { symptom: 'nodal_skin_eruptions', present: true },
      roundsUsed: 0,
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data?.result?.needsFollowUp).toBe(false);
  });

  it('answering no records the symptom as denied for the next turn', async () => {
    // Two vague turns, so we can inspect the carried denied set on the second call.
    const client = fakeClient(
      async () => vague,
      async () => vague,
    );
    const { result } = renderHook(() => useAssessment(client));

    await act(async () => {
      await result.current.submit({ freeText: 'itching', symptomEntries: [] });
    });
    await act(async () => {
      await result.current.answerFollowUp(false);
    });

    expect(client.submitFollowUp).toHaveBeenLastCalledWith({
      assessmentId: vague.assessmentId,
      confirmedSymptoms: ['itching'],
      deniedSymptoms: [],
      answer: { symptom: 'nodal_skin_eruptions', present: false },
      roundsUsed: 0,
    });

    // A second answer carries the first denial and an incremented round count.
    await act(async () => {
      await result.current.answerFollowUp(false);
    });
    expect(client.submitFollowUp).toHaveBeenLastCalledWith({
      assessmentId: vague.assessmentId,
      confirmedSymptoms: ['itching'],
      deniedSymptoms: ['nodal_skin_eruptions'],
      answer: { symptom: 'nodal_skin_eruptions', present: false },
      roundsUsed: 1,
    });
  });

  it('answerFollowUp is a no-op when there is no pending question', async () => {
    const client = fakeClient(async () => confident);
    const { result } = renderHook(() => useAssessment(client));
    await act(async () => {
      await result.current.submit({ freeText: 'itching', symptomEntries: [] });
    });

    let response: unknown;
    await act(async () => {
      response = await result.current.answerFollowUp(true);
    });

    expect(response).toBeNull();
    expect(client.submitFollowUp).not.toHaveBeenCalled();
  });
});
