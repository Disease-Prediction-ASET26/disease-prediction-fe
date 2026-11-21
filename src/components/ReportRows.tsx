import { Link } from 'react-router-dom';
import type { AssessmentSummary } from '../domain/history';
import { formatDate, reportStatusLabel, urgencyLabel } from '../domain/history';
import { formatProbability } from '../domain/format';
import { reportPath } from '../routing/paths';
import { Icon } from './ui/Icon';
import type { BadgeTone } from './ui/Layout';
import { Badge } from './ui/Layout';

const URGENCY_TONES: Record<string, BadgeTone> = {
  EMERGENCY: 'red',
  URGENT: 'orange',
  ADVISORY: 'yellow',
};

/** One line per stored assessment, newest first; each opens the assessment's detail page. */
export function ReportRows({ rows }: { rows: AssessmentSummary[] }) {
  return (
    <ul className="rows" aria-label="Assessments">
      {rows.map((row) => {
        const title =
          row.topDisease ??
          (row.status === 'IN_PROGRESS' ? 'Assessment in progress' : 'No likely condition');
        return (
          <li key={row.id}>
            <Link className="data-row" to={reportPath(row.id)}>
              <span className="row-icon">
                <Icon name="file" />
              </span>
              <span className="row-main">
                <strong>{title}</strong>
                <small>
                  {formatDate(row.createdAt)}
                  {row.topProbability != null && ` · ${formatProbability(row.topProbability)}`}
                  {row.followUpRounds > 0 &&
                    ` · ${row.followUpRounds} follow-up question${row.followUpRounds === 1 ? '' : 's'}`}
                </small>
              </span>
              <Badge tone={row.reportStatus === 'REVIEWED' ? 'green' : 'blue'}>
                {reportStatusLabel(row.reportStatus)}
              </Badge>
              {row.highestUrgency && (
                <Badge tone={URGENCY_TONES[row.highestUrgency]}>
                  {urgencyLabel(row.highestUrgency)}
                </Badge>
              )}
              <Icon name="chevron" size={16} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
