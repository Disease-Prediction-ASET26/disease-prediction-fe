import type { RedFlag, Urgency } from '../domain/assessment';
import { EMERGENCY_NUMBER } from './EmergencyBanner';

export interface UrgencyBannerProps {
  /** Highest urgency from the prediction service; nothing is shown for null or ADVISORY. */
  urgency: Urgency | null;
  /** The red flags that fired, shown as the reasons under the instruction. */
  redFlags?: RedFlag[];
}

/**
 * FR-P5 / UC2: tells the patient how urgently to get care, driven by the red-flag urgency the
 * prediction service computed from the symptoms.
 *
 * - EMERGENCY: call an ambulance (112) or go to the emergency department now.
 * - URGENT: see a doctor promptly today.
 */
export function UrgencyBanner({ urgency, redFlags = [] }: UrgencyBannerProps) {
  if (urgency !== 'EMERGENCY' && urgency !== 'URGENT') return null;

  const reasons = redFlags.filter((flag) => flag.urgency === urgency);

  if (urgency === 'EMERGENCY') {
    return (
      <div className="emergency-banner" role="alert">
        <h2>Call an ambulance ({EMERGENCY_NUMBER}) now</h2>
        <p>
          Call <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a> or go to the nearest
          emergency department now. Do not wait for an online assessment.
        </p>
        <Reasons reasons={reasons} />
      </div>
    );
  }

  return (
    <div className="urgent-banner" role="status">
      <h2>See a doctor promptly</h2>
      <p>
        Book an appointment with a doctor today. If your symptoms get worse, call{' '}
        <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a> or go to the nearest emergency
        department.
      </p>
      <Reasons reasons={reasons} />
    </div>
  );
}

function Reasons({ reasons }: { reasons: RedFlag[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className="urgency-reasons" aria-label="Why we are telling you this">
      {reasons.map((flag) => (
        <li key={flag.name}>{flag.message}</li>
      ))}
    </ul>
  );
}
