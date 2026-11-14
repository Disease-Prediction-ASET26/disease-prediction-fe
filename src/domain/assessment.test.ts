import { hasAnySymptomSignal, isAssessmentResponse, isSeverity } from './assessment';
import { CHECKLIST_SYMPTOMS, toDisplayName, toSymptomEntry } from './symptoms';
import { formatProbability } from './format';
import { predictionResponse } from '../test/mocks/fixtures';

describe('hasAnySymptomSignal (mirrors AssessmentRequest.hasAnySymptomSignal)', () => {
  const entry = toSymptomEntry({ id: 'cough', label: 'Cough' });

  it.each([
    ['', [], false],
    ['   \n\t', [], false],
    ['I have a cough', [], true],
    ['', [entry], true],
    ['cough', [entry], true],
  ] as const)('freeText=%j entries=%j -> %s', (freeText, entries, expected) => {
    expect(hasAnySymptomSignal({ freeText, symptomEntries: [...entries] })).toBe(expected);
  });
});

describe('isAssessmentResponse', () => {
  it('accepts a contract-shaped response', () => {
    expect(isAssessmentResponse(predictionResponse)).toBe(true);
  });

  it('accepts a response with a null result', () => {
    expect(isAssessmentResponse({ assessmentId: 'x', emergencyDetected: true, result: null })).toBe(
      true,
    );
  });

  it.each([
    null,
    'text',
    {},
    { assessmentId: 'x' },
    { assessmentId: 'x', emergencyDetected: false },
  ])('rejects %j', (value) => {
    expect(isAssessmentResponse(value)).toBe(false);
  });
});

describe('isSeverity', () => {
  it('only accepts the backend enum literals', () => {
    expect(['MILD', 'MODERATE', 'SEVERE'].every(isSeverity)).toBe(true);
    expect(isSeverity('mild')).toBe(false);
    expect(isSeverity(1)).toBe(false);
  });
});

describe('symptom vocabulary', () => {
  it('derives human-readable labels from canonical names', () => {
    expect(toDisplayName('high_fever')).toBe('High fever');
    expect(CHECKLIST_SYMPTOMS.find((option) => option.id === 'chest_pain')?.label).toBe(
      'Chest pain',
    );
  });

  it('offers a curated subset of 10 to 15 unique symptoms', () => {
    const ids = CHECKLIST_SYMPTOMS.map((option) => option.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(ids.length).toBeLessThanOrEqual(15);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('formatProbability', () => {
  it.each([
    [0.82, '82%'],
    [0, '0%'],
    [1, '100%'],
    [1.4, '100%'],
    [-0.2, '0%'],
    [Number.NaN, '0%'],
  ])('%s -> %s', (probability, expected) => {
    expect(formatProbability(probability)).toBe(expected);
  });
});
