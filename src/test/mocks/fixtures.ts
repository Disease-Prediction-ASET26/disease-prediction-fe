import type { AssessmentResponse } from '../../domain/assessment';
import type { Profile } from '../../domain/profile';

// Placeholder identifiers only — no real patient data.
export const predictionResponse: AssessmentResponse = {
  assessmentId: '00000000-0000-4000-8000-000000000001',
  emergencyDetected: false,
  result: {
    resultId: '00000000-0000-4000-8000-000000000002',
    generatedAt: '2026-10-31T12:00:00Z',
    disclaimer: 'This is not a medical diagnosis',
    predictions: [
      {
        rank: 2,
        probability: 0.11,
        diseaseName: 'Allergy',
        explanation: { summary: 'Sneezing is a weak match.', contributionWeights: { cough: 0.1 } },
      },
      {
        rank: 1,
        probability: 0.82,
        diseaseName: 'Common Cold',
        explanation: {
          summary: 'Cough and headache are typical of a common cold.',
          contributionWeights: { cough: 0.5, headache: 0.3 },
        },
      },
    ],
  },
};

export const emergencyResponse: AssessmentResponse = {
  ...predictionResponse,
  assessmentId: '00000000-0000-4000-8000-000000000003',
  emergencyDetected: true,
};

// A low-confidence result that offers a follow-up question (FR-P3).
export const followUpResponse: AssessmentResponse = {
  assessmentId: '00000000-0000-4000-8000-000000000004',
  emergencyDetected: false,
  result: {
    resultId: '00000000-0000-4000-8000-000000000005',
    generatedAt: '2026-10-31T12:00:00Z',
    disclaimer: 'This is not a medical diagnosis',
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

// The confident result after the follow-up is answered.
export const followUpResolvedResponse: AssessmentResponse = {
  assessmentId: '00000000-0000-4000-8000-000000000006',
  emergencyDetected: false,
  result: {
    resultId: '00000000-0000-4000-8000-000000000007',
    generatedAt: '2026-10-31T12:00:01Z',
    disclaimer: 'This is not a medical diagnosis',
    predictions: [
      { rank: 1, probability: 0.97, diseaseName: 'Fungal infection', explanation: null },
    ],
    activeSymptoms: ['itching', 'nodal_skin_eruptions'],
    needsFollowUp: false,
    followUp: null,
  },
};

// MDD Iteration 6. Placeholder identity only — no real person.
export const patientProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000010',
  email: 'patient@example.com',
  fullName: 'Test Patient',
  role: 'PATIENT',
  dateOfBirth: '1990-01-01',
  consentGranted: true,
};

export function problem(status: number, code: string) {
  return {
    type: `urn:pocket-doc:problem:${code}`,
    title: 'Error',
    status,
    detail: 'Problem detail from the backend (not shown to patients).',
    code,
  };
}
