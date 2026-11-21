import { Link, useParams } from 'react-router-dom';
import { useAssessmentDetail } from '../../application/useStoredAssessments';
import { PredictionResultView } from '../../components/PredictionResultView';
import { UrgencyBanner } from '../../components/UrgencyBanner';
import { Icon } from '../../components/ui/Icon';
import { Badge, EmptyState, PageHeader } from '../../components/ui/Layout';
import type { AssessmentDetail } from '../../domain/history';
import { formatDate, reportStatusLabel } from '../../domain/history';
import { toDisplayName } from '../../domain/symptoms';
import { PATHS } from '../paths';

/**
 * `/reports/:assessmentId` — one stored assessment (`GET /api/assessments/{id}`): what the patient
 * shared, the urgency, the latest result and the report status. Only the owner can open it; the
 * backend answers 404 for anyone else.
 */
export function ReportDetailRoute() {
  const { assessmentId = '' } = useParams();
  const { state, reload } = useAssessmentDetail(assessmentId);

  return (
    <main className="narrow-page">
      <Link className="text-button back-link" to={PATHS.reports}>
        ← Back to my reports
      </Link>

      {state.status === 'loading' && (
        <>
          <h1>Assessment</h1>
          <p className="message" role="status">
            Loading the assessment…
          </p>
        </>
      )}

      {state.status === 'error' &&
        (state.notFound ? (
          <>
            <h1>Assessment not found</h1>
            <section className="panel">
              <EmptyState
                title="We could not find this assessment"
                body="It may have been removed, or it belongs to another account."
              />
            </section>
          </>
        ) : (
          <>
            <h1>Assessment</h1>
            <div className="message message-error" role="alert">
              <p>{state.message}</p>
              <button type="button" className="button secondary" onClick={reload}>
                Try again
              </button>
            </div>
          </>
        ))}

      {state.status === 'success' && <Detail assessment={state.data} />}
    </main>
  );
}

function Detail({ assessment }: { assessment: AssessmentDetail }) {
  const symptoms = assessment.confirmedSymptoms ?? [];
  const result = assessment.result ?? null;
  const urgency = result?.highestUrgency ?? null;

  return (
    <>
      <PageHeader
        eyebrow={`Assessment · ${formatDate(assessment.createdAt)}`}
        title="Your assessment"
        description={
          assessment.status === 'IN_PROGRESS'
            ? 'This assessment still has an unanswered follow-up question.'
            : 'The result of this assessment, as it was when you completed it.'
        }
        action={
          <Badge tone={assessment.report.status === 'REVIEWED' ? 'green' : 'blue'}>
            Report: {reportStatusLabel(assessment.report.status)}
          </Badge>
        }
      />

      <UrgencyBanner urgency={urgency} redFlags={result?.redFlags} />

      <section className="panel report-section" aria-labelledby="shared-heading">
        <h2 id="shared-heading">Symptoms shared</h2>
        {symptoms.length > 0 ? (
          <ul className="chips" aria-label="Confirmed symptoms">
            {symptoms.map((symptom) => (
              <li key={symptom}>{toDisplayName(symptom)}</li>
            ))}
          </ul>
        ) : (
          <p>No symptoms were recognised.</p>
        )}
        {assessment.freeText && (
          <div className="patient-words">
            <small>In your own words</small>
            <p>“{assessment.freeText}”</p>
          </div>
        )}
        {assessment.followUpRounds > 0 && (
          <p className="report-meta">
            <Icon name="check" size={15} /> {assessment.followUpRounds} follow-up question
            {assessment.followUpRounds === 1 ? '' : 's'} answered
          </p>
        )}
      </section>

      {urgency === 'EMERGENCY' ? null : result ? (
        <PredictionResultView result={result} />
      ) : (
        <section className="panel">
          <EmptyState title="No result" body="No prediction is available for this assessment." />
        </section>
      )}
    </>
  );
}
