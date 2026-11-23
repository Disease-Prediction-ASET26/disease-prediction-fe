import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('switches and remembers the chosen theme', async () => {
    window.localStorage.removeItem('pocket-doc-theme');
    window.history.replaceState(null, '', '/');
    const user = userEvent.setup();
    const view = render(<App authClient={new FakeAuthClient(false)} />);
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('pocket-doc-theme')).toBe('dark');
    view.unmount();
    render(<App authClient={new FakeAuthClient(false)} />);
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
    window.localStorage.removeItem('pocket-doc-theme');
  });
});
