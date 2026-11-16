import { render, screen } from '@testing-library/react';
import { App } from './App';
import { FakeAuthClient } from './test/FakeAuthClient';

describe('App', () => {
  it('mounts the browser router and renders the route for the current URL', async () => {
    window.history.replaceState(null, '', '/');
    render(<App authClient={new FakeAuthClient(false)} />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Check your symptoms' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
