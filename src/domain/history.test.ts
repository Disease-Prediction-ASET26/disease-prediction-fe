import { storedAssessmentDetail, storedAssessments } from '../test/mocks/fixtures';
import {
  formatDate,
  isAssessmentDetail,
  isAssessmentSummary,
  reportStatusLabel,
  urgencyLabel,
} from './history';

describe('isAssessmentSummary', () => {
  it('accepts the contract shape, with or without the optional fields', () => {
    expect(isAssessmentSummary(storedAssessments[0])).toBe(true);
    const minimal = { ...storedAssessments[1] };
    delete (minimal as Partial<typeof minimal>).topDisease;
    delete (minimal as Partial<typeof minimal>).highestUrgency;
    expect(isAssessmentSummary(minimal)).toBe(true);
  });

  it.each([
    null,
    'x',
    { ...storedAssessments[0], status: 'DONE' },
    { ...storedAssessments[0], reportStatus: 'ARCHIVED' },
    { ...storedAssessments[0], highestUrgency: 'PANIC' },
    { ...storedAssessments[0], followUpRounds: '2' },
  ])('rejects %j', (value) => {
    expect(isAssessmentSummary(value)).toBe(false);
  });
});

describe('isAssessmentDetail', () => {
  it('accepts a stored assessment, and one without a result', () => {
    expect(isAssessmentDetail(storedAssessmentDetail)).toBe(true);
    expect(isAssessmentDetail({ ...storedAssessmentDetail, result: null })).toBe(true);
  });

  it('rejects a detail without its report or with a malformed result', () => {
    expect(isAssessmentDetail({ ...storedAssessmentDetail, report: undefined })).toBe(false);
    expect(isAssessmentDetail({ ...storedAssessmentDetail, result: { predictions: 'x' } })).toBe(
      false,
    );
  });
});

describe('labels', () => {
  it('names report statuses and urgencies for patients', () => {
    expect(reportStatusLabel('DRAFT')).toBe('Not sent');
    expect(reportStatusLabel('REVIEWED')).toBe('Reviewed');
    expect(urgencyLabel('URGENT')).toBe('Urgent');
  });

  it('formats ISO dates as "dd Mon yyyy" and leaves unknown input alone', () => {
    expect(formatDate('2026-11-20T09:42:00Z')).toBe('20 Nov 2026');
    expect(formatDate('not a date')).toBe('not a date');
  });
});
