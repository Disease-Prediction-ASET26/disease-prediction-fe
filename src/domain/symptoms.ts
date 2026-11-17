/**
 * Checklist of the canonical symptom vocabulary, organised into clinical groups (FR-P1).
 *
 * Source: disease-prediction-ai `prediction_service/vocabulary.py` (`CANONICAL_SYMPTOMS`, 131
 * entries). Each `id` is identical to a canonical name so a checked item is sent as a mapped
 * `SymptomEntry` with no parsing on the client. A few canonical names carry quirky spacing
 * (`spotting_ urination`, `foul_smell_of urine`, `dischromic _patches`, `toxic_look_(typhos)`);
 * they are kept verbatim so the backend still matches them.
 *
 * The grouping is presentation only. The full vocabulary is covered so the checklist is not a
 * partial subset.
 */

import type { Severity, SymptomEntry } from './assessment';
import { DEFAULT_SEVERITY } from './assessment';

export interface SymptomOption {
  /** Canonical symptom name, sent as `SymptomEntry.rawText`. */
  id: string;
  /** Human-readable label for the checklist. */
  label: string;
}

export interface SymptomGroup {
  /** Section heading shown above the group. */
  title: string;
  options: readonly SymptomOption[];
}

/** Underscores to spaces, parentheses dropped, first letter capitalised. */
export function toDisplayName(canonical: string): string {
  const spaced = canonical.replace(/_/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Canonical symptom ids grouped by body system / theme. Every id below is a member of
 * `CANONICAL_SYMPTOMS`; together these cover the full vocabulary.
 */
const GROUPED_SYMPTOM_IDS: { readonly title: string; readonly ids: readonly string[] }[] = [
  {
    title: 'General',
    ids: [
      'high_fever',
      'mild_fever',
      'sweating',
      'chills',
      'shivering',
      'fatigue',
      'lethargy',
      'malaise',
      'weakness_in_limbs',
      'muscle_weakness',
      'dehydration',
      'weight_gain',
      'weight_loss',
      'obesity',
      'excessive_hunger',
      'increased_appetite',
      'loss_of_appetite',
      'restlessness',
      'toxic_look_(typhos)',
      'family_history',
    ],
  },
  {
    title: 'Skin and nails',
    ids: [
      'itching',
      'internal_itching',
      'skin_rash',
      'nodal_skin_eruptions',
      'red_spots_over_body',
      'dischromic _patches',
      'yellowish_skin',
      'bruising',
      'skin_peeling',
      'silver_like_dusting',
      'pus_filled_pimples',
      'blackheads',
      'scurring',
      'blister',
      'red_sore_around_nose',
      'yellow_crust_ooze',
      'brittle_nails',
      'small_dents_in_nails',
      'inflammatory_nails',
    ],
  },
  {
    title: 'Respiratory and throat',
    ids: [
      'cough',
      'breathlessness',
      'phlegm',
      'mucoid_sputum',
      'rusty_sputum',
      'blood_in_sputum',
      'throat_irritation',
      'patches_in_throat',
      'continuous_sneezing',
      'runny_nose',
      'congestion',
      'sinus_pressure',
    ],
  },
  {
    title: 'Heart and circulation',
    ids: [
      'chest_pain',
      'fast_heart_rate',
      'palpitations',
      'swollen_blood_vessels',
      'prominent_veins_on_calf',
      'swollen_legs',
      'swollen_extremeties',
      'cold_hands_and_feets',
      'fluid_overload',
    ],
  },
  {
    title: 'Digestive',
    ids: [
      'stomach_pain',
      'abdominal_pain',
      'belly_pain',
      'acidity',
      'indigestion',
      'nausea',
      'vomiting',
      'diarrhoea',
      'constipation',
      'ulcers_on_tongue',
      'swelling_of_stomach',
      'distention_of_abdomen',
      'stomach_bleeding',
      'passage_of_gases',
      'pain_during_bowel_movements',
      'pain_in_anal_region',
      'bloody_stool',
      'irritation_in_anus',
    ],
  },
  {
    title: 'Urinary',
    ids: [
      'burning_micturition',
      'spotting_ urination',
      'bladder_discomfort',
      'foul_smell_of urine',
      'continuous_feel_of_urine',
      'dark_urine',
      'yellow_urine',
      'polyuria',
    ],
  },
  {
    title: 'Head, eyes and neurological',
    ids: [
      'headache',
      'dizziness',
      'spinning_movements',
      'loss_of_balance',
      'unsteadiness',
      'blurred_and_distorted_vision',
      'visual_disturbances',
      'pain_behind_the_eyes',
      'redness_of_eyes',
      'watering_from_eyes',
      'yellowing_of_eyes',
      'puffy_face_and_eyes',
      'sunken_eyes',
      'loss_of_smell',
      'slurred_speech',
      'altered_sensorium',
      'lack_of_concentration',
      'weakness_of_one_body_side',
      'coma',
    ],
  },
  {
    title: 'Muscles and joints',
    ids: [
      'joint_pain',
      'knee_pain',
      'hip_joint_pain',
      'neck_pain',
      'back_pain',
      'muscle_pain',
      'muscle_wasting',
      'swelling_joints',
      'movement_stiffness',
      'stiff_neck',
      'painful_walking',
      'cramps',
      'drying_and_tingling_lips',
    ],
  },
  {
    title: 'Mental and mood',
    ids: ['anxiety', 'mood_swings', 'depression', 'irritability'],
  },
  {
    title: 'Metabolic and hormonal',
    ids: [
      'irregular_sugar_level',
      'enlarged_thyroid',
      'abnormal_menstruation',
      'swelled_lymph_nodes',
    ],
  },
  {
    title: 'Liver and other',
    ids: [
      'acute_liver_failure',
      'history_of_alcohol_consumption',
      'receiving_blood_transfusion',
      'receiving_unsterile_injections',
      'extra_marital_contacts',
    ],
  },
];

export const SYMPTOM_GROUPS: readonly SymptomGroup[] = GROUPED_SYMPTOM_IDS.map((group) => ({
  title: group.title,
  options: group.ids.map((id) => ({ id, label: toDisplayName(id) })),
}));

/** Flat list of every checklist option (used as the default and for lookups). */
export const CHECKLIST_SYMPTOMS: readonly SymptomOption[] = SYMPTOM_GROUPS.flatMap(
  (group) => group.options,
);

/** A checked checklist item becomes a mapped `SymptomEntry` (MVP: duration is not collected). */
export function toSymptomEntry(
  option: SymptomOption,
  severity: Severity = DEFAULT_SEVERITY,
): SymptomEntry {
  return { rawText: option.id, severity, durationDays: 0, isMapped: true };
}
