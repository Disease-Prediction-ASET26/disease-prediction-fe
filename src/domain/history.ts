/**
 * TypeScript mirror of the stored-assessment contract (`GET /api/assessments`,
 * `GET /api/assessments/{id}`, backend MDD Iteration 7). Field names match the OpenAPI schemas
 * `AssessmentSummary`, `AssessmentDetail` and `ReportSummary`.
 */
import type { PredictionResult, SymptomEntry, Urgency } from './assessment';
import { URGENCIES } from './assessment';

export const ASSESSMENT_STATUSES = ['IN_PROGRESS', 'COMPLETED'] as const;
/** IN_PROGRESS while a follow-up question is unanswered; COMPLETED otherwise. */
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const REPORT_STATUSES = ['DRAFT', 'SENT', 'OPENED', 'REVIEWED'] as const;
/** Status of the report for a specialist. Stays DRAFT until reports can be sent to a doctor. */
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Mirrors `AssessmentSummary` — one row of the patient's list. */
export interface AssessmentSummary {
  id: string;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  followUpRounds: number;
  topDisease?: string | null;
  topProbability?: number | null;
  highestUrgency?: Urgency | null;
  reportStatus: ReportStatus;
}

/** Mirrors `ReportSummary`. */
export interface ReportSummary {
  id: string;
  status: ReportStatus;
  createdAt: string;
  sentAt?: string | null;
}

/** Mirrors `AssessmentDetail` — one stored assessment with its input, result and report. */
export interface AssessmentDetail {
  id: string;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  followUpRounds: number;
  freeText?: string | null;
  symptomEntries?: SymptomEntry[];
  confirmedSymptoms?: string[];
  deniedSymptoms?: string[];
  result?: PredictionResult | null;
  report: ReportSummary;
}

const includes = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

const isOptionalString = (value: unknown) =>
  value === undefined || value === null || typeof value === 'string';

const isOptionalNumber = (value: unknown) =>
  value === undefined || value === null || typeof value === 'number';

export function isAssessmentSummary(value: unknown): value is AssessmentSummary {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    includes(ASSESSMENT_STATUSES, c.status) &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string' &&
    typeof c.followUpRounds === 'number' &&
    isOptionalString(c.topDisease) &&
    isOptionalNumber(c.topProbability) &&
    (c.highestUrgency === undefined ||
      c.highestUrgency === null ||
      includes(URGENCIES, c.highestUrgency)) &&
    includes(REPORT_STATUSES, c.reportStatus)
  );
}

export function isAssessmentDetail(value: unknown): value is AssessmentDetail {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  const report = c.report as Record<string, unknown> | null | undefined;
  const result = c.result as Record<string, unknown> | null | undefined;
  return (
    typeof c.id === 'string' &&
    includes(ASSESSMENT_STATUSES, c.status) &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string' &&
    typeof c.followUpRounds === 'number' &&
    isOptionalString(c.freeText) &&
    typeof report === 'object' &&
    report !== null &&
    typeof report.id === 'string' &&
    includes(REPORT_STATUSES, report.status) &&
    (result === undefined ||
      result === null ||
      (typeof result === 'object' &&
        typeof result.disclaimer === 'string' &&
        Array.isArray(result.predictions)))
  );
}

/** Patient-facing label for a report status. */
export function reportStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Not sent';
    case 'SENT':
      return 'Sent';
    case 'OPENED':
      return 'Opened';
    case 'REVIEWED':
      return 'Reviewed';
  }
}

/** Patient-facing label for an urgency level. */
export function urgencyLabel(urgency: Urgency): string {
  switch (urgency) {
    case 'EMERGENCY':
      return 'Emergency';
    case 'URGENT':
      return 'Urgent';
    case 'ADVISORY':
      return 'Advisory';
  }
}

/** "18 Jun 2025" in the browser's locale-independent English format used across the app. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
