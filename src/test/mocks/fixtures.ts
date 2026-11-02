import type { AssessmentResponse } from '../../domain/assessment';

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
