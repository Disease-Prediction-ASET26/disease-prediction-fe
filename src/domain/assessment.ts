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
  /** FR-P3: short description of the disease, when the prediction service knows it. */
  description?: string | null;
  /** FR-P3: recommended precautions. */
  precautions?: string[] | null;
  /** FR-P4: medical specialty to consult. */
  specialty?: string | null;
  explanation: Explanation | null;
}

/** Mirrors `PredictionResultDto`. */
export interface PredictionResult {
  resultId: string;
  generatedAt: string;
  disclaimer: string;
  predictions: DiseasePrediction[];
}

/** Mirrors `AssessmentResponse`. */
export interface AssessmentResponse {
  assessmentId: string;
  emergencyDetected: boolean;
  result: PredictionResult | null;
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
