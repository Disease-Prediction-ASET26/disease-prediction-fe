import { hasAnySymptomSignal, isAssessmentResponse, isSeverity, urgencyOf } from './assessment';
import { CHECKLIST_SYMPTOMS, SYMPTOM_GROUPS, toDisplayName, toSymptomEntry } from './symptoms';
import { formatProbability } from './format';
import { emergencyResponse, predictionResponse, urgentResponse } from '../test/mocks/fixtures';

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

  it('offers the symptoms as non-empty named groups', () => {
    expect(SYMPTOM_GROUPS.length).toBeGreaterThan(1);
    for (const group of SYMPTOM_GROUPS) {
      expect(group.title.length).toBeGreaterThan(0);
      expect(group.options.length).toBeGreaterThan(0);
    }
  });

  it('exposes every grouped symptom in the flat list with unique ids', () => {
    const ids = CHECKLIST_SYMPTOMS.map((option) => option.id);
    const grouped = SYMPTOM_GROUPS.flatMap((group) => group.options.map((o) => o.id));
    // The flat list is exactly the union of the groups.
    expect(ids).toEqual(grouped);
    // No symptom appears twice (which would collide on checkbox id).
    expect(new Set(ids).size).toBe(ids.length);
    // The checklist is substantial, not a tiny hand-picked subset.
    expect(ids.length).toBeGreaterThan(100);
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

describe('urgencyOf', () => {
  it('uses the relayed highestUrgency', () => {
    expect(urgencyOf(emergencyResponse)).toBe('EMERGENCY');
    expect(urgencyOf(urgentResponse)).toBe('URGENT');
    expect(urgencyOf(predictionResponse)).toBeNull();
  });

  it('falls back to emergencyDetected for older responses without highestUrgency', () => {
    expect(urgencyOf({ ...predictionResponse, emergencyDetected: true })).toBe('EMERGENCY');
    expect(urgencyOf({ assessmentId: 'x', emergencyDetected: true, result: null })).toBe(
      'EMERGENCY',
    );
  });
});
