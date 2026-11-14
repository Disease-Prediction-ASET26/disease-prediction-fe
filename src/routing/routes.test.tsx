import { screen, within } from '@testing-library/react';
import { emergencyResponse, predictionResponse } from '../test/mocks/fixtures';
import { renderAppAt } from '../test/renderRouter';
import { PATHS, readAssessmentState } from './paths';

describe('route model', () => {
  it('/ renders the home view with a link to /assessment', () => {
    renderAppAt(PATHS.home);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Check your symptoms' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start an assessment' })).toHaveAttribute(
      'href',
      PATHS.assessment,
    );
  });

  it('renders a labelled main navigation on every route', () => {
    renderAppAt(PATHS.assessment);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'New assessment' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('/assessment renders the Iteration 3 assessment form', () => {
    renderAppAt(PATHS.assessment);

    expect(screen.getByRole('textbox', { name: 'Describe your symptoms' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get assessment' })).toBeDisabled();
  });

  it.each(['/does-not-exist', '/assessment/unknown', '/assessment/result/extra'])(
    'unknown path %s renders the not-found page',
    (path) => {
      renderAppAt(path);
      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    },
  );

  it.each([PATHS.result, PATHS.emergency])(
    '%s without result state redirects to /assessment',
    (path) => {
      const { router } = renderAppAt(path);

      expect(router.state.location.pathname).toBe(PATHS.assessment);
      expect(screen.getByRole('button', { name: 'Get assessment' })).toBeInTheDocument();
    },
  );

  it('/assessment/result with malformed state redirects to /assessment', () => {
    const { router } = renderAppAt({ pathname: PATHS.result, state: { assessment: { nope: 1 } } });
    expect(router.state.location.pathname).toBe(PATHS.assessment);
  });

  it('/assessment/result with state renders the predictions and disclaimer', () => {
    renderAppAt({ pathname: PATHS.result, state: { assessment: predictionResponse } });

    expect(screen.getByRole('heading', { name: 'Possible conditions' })).toBeInTheDocument();
    expect(screen.getByText('Common Cold')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('This is not a medical diagnosis');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('/assessment/result with a null result explains that nothing is available', () => {
    renderAppAt({
      pathname: PATHS.result,
      state: { assessment: { ...predictionResponse, result: null } },
    });
    expect(screen.getByText(/No prediction is available/)).toBeInTheDocument();
  });

  it('/assessment/emergency with state shows only the 112 alert, no predictions', () => {
    renderAppAt({ pathname: PATHS.emergency, state: { assessment: emergencyResponse } });

    expect(screen.getByRole('alert')).toHaveTextContent('112');
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /assessment details/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a new assessment' })).toHaveAttribute(
      'href',
      PATHS.assessment,
    );
  });

  it('/assessment/result with an emergency assessment redirects to the emergency view', () => {
    const { router } = renderAppAt({
      pathname: PATHS.result,
      state: { assessment: emergencyResponse },
    });

    expect(router.state.location.pathname).toBe(PATHS.emergency);
    expect(screen.getByRole('alert')).toHaveTextContent('112');
    expect(screen.queryByText('Common Cold')).not.toBeInTheDocument();
  });
});

describe('readAssessmentState', () => {
  it.each([undefined, null, 'x', {}, { assessment: null }, { assessment: { assessmentId: 1 } }])(
    'returns null for %j',
    (state) => {
      expect(readAssessmentState(state)).toBeNull();
    },
  );

  it('returns the carried response', () => {
    expect(readAssessmentState({ assessment: predictionResponse })).toBe(predictionResponse);
  });
});
