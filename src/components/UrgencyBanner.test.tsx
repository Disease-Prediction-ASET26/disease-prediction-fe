import { render, screen, within } from '@testing-library/react';
import { emergencyResponse, urgentResponse } from '../test/mocks/fixtures';
import { UrgencyBanner } from './UrgencyBanner';

describe('UrgencyBanner', () => {
  it('EMERGENCY: a red alert telling the patient to call an ambulance (112)', () => {
    render(<UrgencyBanner urgency="EMERGENCY" redFlags={emergencyResponse.result!.redFlags} />);

    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByRole('heading', { name: 'Call an ambulance (112) now' }),
    ).toBeInTheDocument();
    expect(within(alert).getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112');
    expect(alert).toHaveClass('emergency-banner');
    const reasons = within(alert).getByRole('list', { name: 'Why we are telling you this' });
    expect(reasons).toHaveTextContent(/heart emergency/);
  });

  it('URGENT: an amber notice telling the patient to see a doctor promptly', () => {
    render(<UrgencyBanner urgency="URGENT" redFlags={urgentResponse.result!.redFlags} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const notice = screen.getByRole('status');
    expect(notice).toHaveClass('urgent-banner');
    expect(
      within(notice).getByRole('heading', { name: 'See a doctor promptly' }),
    ).toBeInTheDocument();
    expect(notice).toHaveTextContent(/A high fever/);
    expect(notice).not.toHaveTextContent(/Call an ambulance/);
  });

  it('only lists the reasons at the banner’s own urgency', () => {
    render(
      <UrgencyBanner
        urgency="EMERGENCY"
        redFlags={[...emergencyResponse.result!.redFlags!, ...urgentResponse.result!.redFlags!]}
      />,
    );

    expect(screen.getByRole('alert')).not.toHaveTextContent(/A high fever/);
  });

  it.each([null, 'ADVISORY'] as const)('renders nothing for %s', (urgency) => {
    const { container } = render(<UrgencyBanner urgency={urgency} />);

    expect(container).toBeEmptyDOMElement();
  });
});
