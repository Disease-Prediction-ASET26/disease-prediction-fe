import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('mounts the browser router and renders the route for the current URL', () => {
    window.history.replaceState(null, '', '/');
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Check your symptoms' }),
    ).toBeInTheDocument();
  });
});
