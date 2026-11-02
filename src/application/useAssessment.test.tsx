import { act, renderHook, waitFor } from '@testing-library/react';
import type { AssessmentApiClient } from '../api/AssessmentApiClient';
import { NetworkError, ValidationError } from '../api/errors';
import { predictionResponse } from '../test/mocks/fixtures';
import { buildAssessmentRequest, useAssessment } from './useAssessment';

const cough = { rawText: 'cough', severity: 'MILD', durationDays: 0, isMapped: true } as const;

function fakeClient(impl: AssessmentApiClient['submitAssessment']): AssessmentApiClient {
  return { submitAssessment: vi.fn(impl) };
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
