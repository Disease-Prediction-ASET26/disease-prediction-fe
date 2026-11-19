import { render, screen, within } from '@testing-library/react';
import { predictionResponse } from '../test/mocks/fixtures';
import { PredictionResultView } from './PredictionResultView';

const result = predictionResponse.result!;

describe('PredictionResultView', () => {
  it('shows only the top-ranked condition, not the lower-ranked ones', () => {
    render(<PredictionResultView result={result} />);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Common Cold']);
    expect(screen.queryByText('Allergy')).not.toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.queryByText('11%')).not.toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });

  it('renders the description, explanation summary and contributing symptoms', () => {
    render(<PredictionResultView result={result} />);

    expect(
      screen.getByText('A common viral infection of the nose and throat.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cough and headache are typical of a common cold.'),
    ).toBeInTheDocument();
    const contributions = screen.getByRole('list', {
      name: 'Contributing symptoms for Common Cold',
    });
    expect(within(contributions).getByText(/Cough/)).toBeInTheDocument();
    expect(within(contributions).getByText(/Headache/)).toBeInTheDocument();
  });

  it('renders the recommended precautions for the top condition', () => {
    render(<PredictionResultView result={result} />);

    const precautions = screen.getByRole('list', { name: 'Precautions for Common Cold' });
    expect(within(precautions).getByText('rest')).toBeInTheDocument();
    expect(within(precautions).getByText('drink fluids')).toBeInTheDocument();
    expect(within(precautions).getByText('stay warm')).toBeInTheDocument();
  });

  it('always renders the disclaimer, even with no predictions', () => {
    render(<PredictionResultView result={{ ...result, predictions: [] }} />);

    expect(screen.getByRole('note')).toHaveTextContent('This is not a medical diagnosis');
    expect(screen.getByText(/No likely conditions were identified/)).toBeInTheDocument();
  });

  it('falls back to a default disclaimer if the backend sends an empty one', () => {
    render(<PredictionResultView result={{ ...result, disclaimer: '' }} />);
    expect(screen.getByRole('note')).toHaveTextContent('This is not a medical diagnosis.');
  });
});
