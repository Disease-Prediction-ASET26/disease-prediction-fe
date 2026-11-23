import type { AssessmentResponse } from '../../domain/assessment';
import type { AssessmentDetail, AssessmentSummary } from '../../domain/history';
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
        description: 'A common viral infection of the nose and throat.',
        precautions: ['rest', 'drink fluids', 'stay warm'],
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
  result: {
    ...predictionResponse.result!,
    redFlags: [
      {
        name: 'possible_cardiac_event',
        urgency: 'EMERGENCY',
        message:
          'Chest pain with breathlessness or sweating may be a heart emergency. Call emergency services (112) or go to the nearest emergency department now.',
        matchedSymptoms: ['breathlessness', 'chest_pain'],
      },
    ],
    highestUrgency: 'EMERGENCY',
    // Like the real service: a vague emergency set is also low-confidence, so the response still
    // offers a follow-up question. The emergency must win over the question.
    needsFollowUp: true,
    followUp: {
      symptom: 'sweating',
      question: 'Are you sweating?',
      topDisease: 'Heart attack',
      confidence: 0.41,
    },
  },
};

// A single serious symptom: see a doctor promptly, not an ambulance.
export const urgentResponse: AssessmentResponse = {
  ...predictionResponse,
  assessmentId: '00000000-0000-4000-8000-000000000005',
  emergencyDetected: false,
  result: {
    ...predictionResponse.result!,
    redFlags: [
      {
        name: 'high_fever',
        urgency: 'URGENT',
        message: 'A high fever. See a doctor promptly today; seek emergency care if it gets worse.',
        matchedSymptoms: ['high_fever'],
      },
    ],
    highestUrgency: 'URGENT',
  },
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

// Stored assessments (GET /api/assessments, backend MDD Iteration 7). Placeholder ids only.
export const storedAssessments: AssessmentSummary[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    status: 'COMPLETED',
    createdAt: '2026-11-20T09:42:00Z',
    updatedAt: '2026-11-20T09:44:00Z',
    followUpRounds: 2,
    topDisease: 'Migraine',
    topProbability: 0.72,
    highestUrgency: 'URGENT',
    reportStatus: 'DRAFT',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    status: 'COMPLETED',
    createdAt: '2026-11-02T15:10:00Z',
    updatedAt: '2026-11-02T15:10:00Z',
    followUpRounds: 0,
    topDisease: 'Common Cold',
    topProbability: 0.82,
    highestUrgency: null,
    reportStatus: 'REVIEWED',
  },
];

export const storedAssessmentDetail: AssessmentDetail = {
  id: storedAssessments[0].id,
  status: 'COMPLETED',
  createdAt: storedAssessments[0].createdAt,
  updatedAt: storedAssessments[0].updatedAt,
  followUpRounds: 2,
  freeText: 'Strong headache since yesterday, bright light makes it worse.',
  symptomEntries: [],
  confirmedSymptoms: ['headache', 'nausea'],
  deniedSymptoms: ['high_fever'],
  result: {
    ...predictionResponse.result!,
    predictions: [
      {
        rank: 1,
        probability: 0.72,
        diseaseName: 'Migraine',
        description: 'A headache that can cause intense throbbing pain.',
        precautions: ['rest in a dark room'],
        explanation: null,
      },
    ],
    redFlags: urgentResponse.result!.redFlags,
    highestUrgency: 'URGENT',
  },
  report: {
    id: '00000000-0000-4000-8000-000000000201',
    status: 'DRAFT',
    createdAt: storedAssessments[0].createdAt,
    sentAt: null,
  },
};
