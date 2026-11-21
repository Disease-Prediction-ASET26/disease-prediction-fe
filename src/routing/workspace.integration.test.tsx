import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { Role } from '../domain/profile';
import { patientProfile } from '../test/mocks/fixtures';
import { ASSESSMENTS_URL, backend } from '../test/mocks/handlers';
import { server } from '../test/mocks/server';
import { renderApp, renderAppAt } from '../test/renderRouter';
import { PATHS, reportPath } from './paths';

/**
 * Pocket Doc app shell: the workspace of each role, the patient's stored reports (backend MDD
 * Iteration 7) and the pages that have no API yet. Real route table, providers and HTTP client;
 * the backend is MSW.
 */
const renderAs = (role: Role, path: string) => {
  const profile = { ...patientProfile, role, fullName: 'Sam Lee' };
  backend.profile = profile;
  return renderApp({ entries: [path], authStatus: 'authenticated', profile });
};

const navLinks = () =>
  within(screen.getByRole('navigation', { name: 'Main' }))
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('app shell and workspaces (integration)', () => {
  it('a patient sees the patient workspace and who is signed in', () => {
    renderAppAt(PATHS.assessment);

    expect(navLinks()).toEqual([
      'Overview',
      'New assessment',
      'My reports',
      'Appointments',
      'Account',
    ]);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Patient workspace')).toBeInTheDocument();
    expect(within(header).getByText(patientProfile.fullName)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('before sign-in only the public pages are offered', async () => {
    renderApp({ entries: [PATHS.home], authStatus: 'anonymous', profile: null });

    expect(navLinks()).toEqual(['Home', 'Sign in']);
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('the mobile menu button opens and closes the navigation', async () => {
    renderAppAt(PATHS.home);
    const open = screen.getByRole('button', { name: 'Open navigation' });

    await userEvent.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getAllByRole('button', { name: 'Close navigation' })[0]);
    expect(open).toHaveAttribute('aria-expanded', 'false');
  });

  describe('patient reports', () => {
    it('lists the stored assessments and opens one', async () => {
      const { router } = renderAppAt(PATHS.reports);

      const list = await screen.findByRole('list', { name: 'Assessments' });
      const rows = within(list).getAllByRole('link');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('Migraine');
      expect(rows[0]).toHaveTextContent('Not sent');
      expect(rows[0]).toHaveTextContent('Urgent');
      expect(rows[1]).toHaveTextContent('Reviewed');

      await userEvent.click(rows[0]);

      expect(router.state.location.pathname).toBe(reportPath(backend.details[0].id));
      expect(await screen.findByRole('heading', { name: 'See a doctor promptly' })).toBeVisible();
      const shared = screen.getByRole('list', { name: 'Confirmed symptoms' });
      expect(
        within(shared)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Headache', 'Nausea']);
      expect(screen.getByText(/bright light makes it worse/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Migraine' })).toBeInTheDocument();
      expect(screen.getByText('Report: Not sent')).toBeInTheDocument();
    });

    it('filters by report status and searches by condition', async () => {
      renderAppAt(PATHS.reports);
      const list = await screen.findByRole('list', { name: 'Assessments' });

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Filter by report status' }),
        'REVIEWED',
      );
      expect(within(list).getAllByRole('link')).toHaveLength(1);
      expect(list).toHaveTextContent('Common Cold');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Filter by report status' }),
        'ALL',
      );
      await userEvent.type(screen.getByRole('searchbox', { name: 'Search by condition' }), 'migr');
      expect(within(list).getAllByRole('link')).toHaveLength(1);
      expect(list).toHaveTextContent('Migraine');
    });

    it('shows an empty state when there are no assessments yet', async () => {
      backend.assessments = [];
      renderAppAt(PATHS.reports);

      expect(await screen.findByRole('heading', { name: 'No assessments yet' })).toBeVisible();
      expect(
        within(screen.getByRole('main')).getByRole('link', { name: 'Start an assessment' }),
      ).toHaveAttribute('href', PATHS.assessment);
    });

    it('offers a retry when the list cannot be loaded', async () => {
      server.use(
        http.get(ASSESSMENTS_URL, () => new HttpResponse(null, { status: 503 }), { once: true }),
      );
      renderAppAt(PATHS.reports);

      expect(await screen.findByRole('alert')).toHaveTextContent(/unavailable/);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByRole('list', { name: 'Assessments' })).toBeInTheDocument();
    });

    it('an unknown assessment id shows "not found"', async () => {
      renderAppAt(reportPath('00000000-0000-4000-8000-999999999999'));

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Assessment not found' }),
      ).toBeVisible();
    });

    it('stays readable after consent is withdrawn', async () => {
      const profile = { ...patientProfile, consentGranted: false };
      backend.profile = profile;
      renderApp({ entries: [PATHS.reports], authStatus: 'authenticated', profile });

      expect(await screen.findByRole('list', { name: 'Assessments' })).toBeInTheDocument();
    });
  });

  it('appointments show that booking is not available yet, with no sample data', () => {
    renderAppAt(PATHS.appointments);

    expect(screen.getByRole('heading', { name: 'Booking is not available yet' })).toBeVisible();
  });

  describe('doctor workspace', () => {
    it('has its own navigation and an empty review inbox', () => {
      renderAs('DOCTOR', PATHS.home);

      expect(navLinks()).toEqual([
        'Dashboard',
        'Assessments',
        'Schedule',
        'Doctor profile',
        'Account',
      ]);
      expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Sam Lee' })).toBeVisible();
      expect(screen.getByRole('heading', { name: 'No assessments to review' })).toBeVisible();
    });

    it('shows the real name and email on the doctor profile', () => {
      renderAs('DOCTOR', PATHS.doctorProfile);

      const card = screen.getByRole('region', { name: 'Your profile' });
      expect(within(card).getByRole('heading', { name: 'Sam Lee' })).toBeVisible();
      expect(within(card).getByText(patientProfile.email)).toBeVisible();
    });

    it('cannot open patient pages', () => {
      renderAs('DOCTOR', PATHS.reports);

      expect(
        screen.getByRole('heading', { name: 'This page is not part of your workspace' }),
      ).toBeVisible();
    });
  });

  describe('administrator workspace', () => {
    it('has its own navigation and honest empty states', () => {
      renderAs('ADMIN', PATHS.adminModel);

      expect(navLinks()).toEqual([
        'Overview',
        'Doctors',
        'Users',
        'AI model',
        'Access audit',
        'Account',
      ]);
      expect(
        screen.getByRole('heading', { name: 'Model details are not available yet' }),
      ).toBeVisible();
    });

    it('is closed to patients', () => {
      renderAppAt(PATHS.adminUsers);

      expect(
        screen.getByRole('heading', { name: 'This page is not part of your workspace' }),
      ).toBeVisible();
    });
  });
});
