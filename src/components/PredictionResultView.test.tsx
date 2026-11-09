import { render, screen, within } from '@testing-library/react';
import { predictionResponse } from '../test/mocks/fixtures';
import { PredictionResultView } from './PredictionResultView';

const result = predictionResponse.result!;

describe('PredictionResultView', () => {
  it('lists predictions in rank order with name and probability as a percentage', () => {
    render(<PredictionResultView result={result} />);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Common Cold', 'Allergy']);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('11%')).toBeInTheDocument();
  });

  it('renders the explanation summary and contributing symptoms', () => {
    render(<PredictionResultView result={result} />);

    expect(
      screen.getByText('Cough and headache are typical of a common cold.'),
    ).toBeInTheDocument();
    const contributions = screen.getByRole('list', {
      name: 'Contributing symptoms for Common Cold',
    });
    expect(within(contributions).getByText(/Cough/)).toBeInTheDocument();
    expect(within(contributions).getByText(/Headache/)).toBeInTheDocument();
  });

  it('renders the description, precautions and specialty when present', () => {
    render(<PredictionResultView result={result} />);

    expect(screen.getByText('A viral infection of the nose and throat.')).toBeInTheDocument();
    const precautions = screen.getByRole('list', { name: 'Precautions for Common Cold' });
    expect(
      within(precautions)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['rest', 'drink fluids']);
    expect(screen.getByText(/Specialist to consult/)).toHaveTextContent(
      'Specialist to consult: General Medicine',
    );
  });

  it('omits description, precautions and specialty when the backend does not send them', () => {
    render(<PredictionResultView result={result} />);

    expect(screen.queryByRole('list', { name: 'Precautions for Allergy' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Specialist to consult/)).toHaveLength(1);
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
