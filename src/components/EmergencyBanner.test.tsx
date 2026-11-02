import { render, screen } from '@testing-library/react';
import { EmergencyBanner } from './EmergencyBanner';

describe('EmergencyBanner', () => {
  it('renders an alert pointing to 112 when visible', () => {
    render(<EmergencyBanner visible />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('112');
    expect(screen.getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112');
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<EmergencyBanner visible={false} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
