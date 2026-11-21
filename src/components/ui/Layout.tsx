import type { ReactNode } from 'react';
import type { IconName } from './Icon';
import { Icon } from './Icon';

export type BadgeTone = 'neutral' | 'blue' | 'green' | 'yellow' | 'orange' | 'red';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

/** The page title block of the Pocket Doc design. The `h1` is the route's main heading. */
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  body: ReactNode;
  icon?: IconName;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon = 'file', action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span>
        <Icon name={icon} size={24} />
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}

/** The amber emergency reminder shown above patient pages. */
export function EmergencyNote({ children }: { children: ReactNode }) {
  return (
    <p className="emergency-note">
      <Icon name="alert" size={16} />
      <span>{children}</span>
    </p>
  );
}
