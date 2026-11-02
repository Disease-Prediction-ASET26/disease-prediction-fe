export const EMERGENCY_NUMBER = '112';

export interface EmergencyBannerProps {
  visible: boolean;
}

/** FR-P5 / UC2: high-priority alert telling the patient to contact emergency services. */
export function EmergencyBanner({ visible }: EmergencyBannerProps) {
  if (!visible) return null;

  return (
    <div className="emergency-banner" role="alert">
      <h2>Your symptoms may need urgent medical attention</h2>
      <p>
        Call <a href={`tel:${EMERGENCY_NUMBER}`}>{EMERGENCY_NUMBER}</a> now, or go to the nearest
        emergency department. Do not wait for an online assessment.
      </p>
    </div>
  );
}
