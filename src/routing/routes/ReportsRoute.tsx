import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssessmentList } from '../../application/useStoredAssessments';
import { ReportRows } from '../../components/ReportRows';
import { Icon } from '../../components/ui/Icon';
import { EmptyState, PageHeader } from '../../components/ui/Layout';
import type { ReportStatus } from '../../domain/history';
import { REPORT_STATUSES, reportStatusLabel } from '../../domain/history';
import { PATHS } from '../paths';

/**
 * `/reports` — the signed-in patient's stored assessments (`GET /api/assessments`, backend MDD
 * Iteration 7), newest first, with a text search and a report-status filter.
 */
export function ReportsRoute() {
  const { state, reload } = useAssessmentList();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const searchId = useId();
  const statusId = useId();

  const rows =
    state.status === 'success'
      ? state.data.filter(
          (row) =>
            (status === 'ALL' || row.reportStatus === status) &&
            (query.trim() === '' ||
              (row.topDisease ?? '').toLowerCase().includes(query.trim().toLowerCase())),
        )
      : [];

  return (
    <main>
      <PageHeader
        title="My reports"
        description="Your symptom assessments and the status of their reports."
        action={
          <Link className="button primary" to={PATHS.assessment}>
            <Icon name="plus" /> New assessment
          </Link>
        }
      />

      {state.status === 'loading' && (
        <p className="message" role="status">
          Loading your assessments…
        </p>
      )}

      {state.status === 'error' && (
        <div className="message message-error" role="alert">
          <p>{state.message}</p>
          <button type="button" className="button secondary" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <section className="panel" aria-label="Your assessments">
            <EmptyState
              title="No assessments yet"
              body="When you complete a symptom assessment, it appears here."
              action={
                <Link className="button primary" to={PATHS.assessment}>
                  Start an assessment
                </Link>
              }
            />
          </section>
        ) : (
          <>
            <div className="toolbar">
              <div className="search">
                <Icon name="search" />
                <label htmlFor={searchId} className="visually-hidden">
                  Search by condition
                </label>
                <input
                  id={searchId}
                  type="search"
                  placeholder="Search by condition"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <label htmlFor={statusId} className="visually-hidden">
                Filter by report status
              </label>
              <select
                id={statusId}
                value={status}
                onChange={(event) => setStatus(event.target.value as ReportStatus | 'ALL')}
              >
                <option value="ALL">All statuses</option>
                {REPORT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {reportStatusLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <section className="panel" aria-label="Your assessments">
              {rows.length > 0 ? (
                <ReportRows rows={rows} />
              ) : (
                <p className="panel-message">No assessments match your search.</p>
              )}
            </section>
          </>
        ))}
    </main>
  );
}
