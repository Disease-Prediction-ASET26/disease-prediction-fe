/**
 * TypeScript mirror of the backend contract for `POST /api/assessments`.
 *
 * MDD Iteration 3 — model elements: AssessmentRequest, AssessmentResponse, PredictionResult,
 * SymptomEntry, Severity. Source of truth: disease-prediction-be
 * `com.diseaseprediction.controller.dto.*` and `domain.enums.Severity`. Field names must match
 * those records exactly.
 */

export const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE'] as const;

/** Mirrors `com.diseaseprediction.domain.enums.Severity`. */
export type Severity = (typeof SEVERITIES)[number];

export const DEFAULT_SEVERITY: Severity = 'MODERATE';

/** Mirrors `SymptomEntryDto`. */
export interface SymptomEntry {
  rawText: string;
  severity: Severity;
  durationDays: number;
  isMapped: boolean;
}

/** Mirrors `AssessmentRequest`. */
export interface AssessmentRequest {
  patientId: string | null;
  freeText: string;
  symptomEntries: SymptomEntry[];
}

/** Mirrors `ExplanationDto`. */
export interface Explanation {
  summary: string;
  contributionWeights: Record<string, number>;
}

/** Mirrors `DiseasePredictionDto`. */
export interface DiseasePrediction {
  rank: number;
  probability: number;
  diseaseName: string;
  explanation: Explanation | null;
  /** Human-readable description of the disease, when available. */
  description?: string | null;
  /** Recommended precautions for the disease (may be empty or absent). */
  precautions?: string[];
}

/** Mirrors `PredictionResultDto`. */
export interface PredictionResult {
  resultId: string;
  generatedAt: string;
  disclaimer: string;
  predictions: DiseasePrediction[];
  /**
   * Canonical symptoms currently known present, echoed by the backend so the client can carry
   * them into a follow-up request. Absent on older responses.
   */
  activeSymptoms?: string[];
  /** True when confidence is below the threshold and a follow-up question is offered. */
  needsFollowUp?: boolean;
  /** A yes/no question that would sharpen a low-confidence prediction, or null. */
  followUp?: FollowUp | null;
}

/** Mirrors `FollowUp` — a yes/no question about a symptom (FR-P3 adaptive questioning). */
export interface FollowUp {
  symptom: string;
  question: string;
  topDisease: string;
  confidence: number;
}

/** Mirrors `AssessmentResponse`. */
export interface AssessmentResponse {
  assessmentId: string;
  emergencyDetected: boolean;
  result: PredictionResult | null;
}

/** The patient's yes/no answer to a follow-up question. Mirrors `FollowupAnswer`. */
export interface FollowUpAnswer {
  symptom: string;
  present: boolean;
}

/**
 * Mirrors `FollowupRequest` for `POST /api/assessments/followup`. The loop is stateless on the
 * server, so the client carries the symptoms confirmed and denied so far plus the latest answer.
 */
export interface FollowUpRequest {
  confirmedSymptoms: string[];
  deniedSymptoms: string[];
  answer: FollowUpAnswer | null;
  roundsUsed: number;
}

export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value);
}

/**
 * Mirrors backend `AssessmentRequest.hasAnySymptomSignal()`: a request is valid when it has
 * non-blank free text or at least one symptom entry. The UI uses this to disable submit, so the
 * client never sends a request the backend would reject with 400.
 */
export function hasAnySymptomSignal(
  request: Pick<AssessmentRequest, 'freeText' | 'symptomEntries'>,
): boolean {
  const hasText = request.freeText.trim().length > 0;
  const hasEntries = request.symptomEntries.length > 0;
  return hasText || hasEntries;
}

/** Shallow runtime check that a parsed JSON body has the shape of an AssessmentResponse. */
export function isAssessmentResponse(value: unknown): value is AssessmentResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.assessmentId !== 'string') return false;
  if (typeof candidate.emergencyDetected !== 'boolean') return false;
  if (candidate.result === null) return true;
  if (typeof candidate.result !== 'object' || candidate.result === undefined) return false;
  const result = candidate.result as Record<string, unknown>;
  return typeof result.disclaimer === 'string' && Array.isArray(result.predictions);
}
