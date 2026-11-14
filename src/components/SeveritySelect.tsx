import { useId } from 'react';
import type { Severity } from '../domain/assessment';
import { SEVERITIES, isSeverity } from '../domain/assessment';

const SEVERITY_LABELS: Record<Severity, string> = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
};

export interface SeveritySelectProps {
  /** Display name of the symptom, used in the accessible label. */
  symptomLabel: string;
  value: Severity;
  onChange: (severity: Severity) => void;
  disabled?: boolean;
}

/** Per-symptom severity picker (MILD / MODERATE / SEVERE), shown next to a checked symptom. */
export function SeveritySelect({
  symptomLabel,
  value,
  onChange,
  disabled = false,
}: SeveritySelectProps) {
  const id = useId();

  return (
    <span className="severity-select">
      <label htmlFor={id} className="visually-hidden">
        Severity of {symptomLabel}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (isSeverity(event.target.value)) onChange(event.target.value);
        }}
      >
        {SEVERITIES.map((severity) => (
          <option key={severity} value={severity}>
            {SEVERITY_LABELS[severity]}
          </option>
        ))}
      </select>
    </span>
  );
}
