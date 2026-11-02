/**
 * Curated checklist subset of the canonical symptom vocabulary.
 *
 * Source: disease-prediction-ai `prediction_service/vocabulary.py` (`CANONICAL_SYMPTOMS`, 131
 * entries). Each `id` must stay identical to a canonical name so a checked item can be sent as a
 * mapped `SymptomEntry` without any parsing on the client.
 */

import type { Severity, SymptomEntry } from './assessment';
import { DEFAULT_SEVERITY } from './assessment';

export interface SymptomOption {
  /** Canonical symptom name, sent as `SymptomEntry.rawText`. */
  id: string;
  /** Human-readable label for the checklist. */
  label: string;
}

export const CHECKLIST_SYMPTOM_IDS = [
  'cough',
  'high_fever',
  'mild_fever',
  'headache',
  'fatigue',
  'nausea',
  'vomiting',
  'diarrhoea',
  'chest_pain',
  'breathlessness',
  'runny_nose',
  'joint_pain',
  'skin_rash',
  'dizziness',
  'abdominal_pain',
] as const;

/** Underscores to spaces, first letter capitalised. */
export function toDisplayName(canonical: string): string {
  const spaced = canonical.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const CHECKLIST_SYMPTOMS: readonly SymptomOption[] = CHECKLIST_SYMPTOM_IDS.map((id) => ({
  id,
  label: toDisplayName(id),
}));

/** A checked checklist item becomes a mapped `SymptomEntry` (MVP: duration is not collected). */
export function toSymptomEntry(
  option: SymptomOption,
  severity: Severity = DEFAULT_SEVERITY,
): SymptomEntry {
  return { rawText: option.id, severity, durationDays: 0, isMapped: true };
}
