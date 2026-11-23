import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FollowUp } from '../domain/assessment';
import { FollowUpQuestion } from './FollowUpQuestion';

const followUp: FollowUp = {
  symptom: 'nodal_skin_eruptions',
  question: 'Do you also have nodal skin eruptions?',
  topDisease: 'Fungal infection',
  confidence: 0.48,
};

describe('FollowUpQuestion', () => {
  it('renders the question and both answer buttons', () => {
    render(<FollowUpQuestion followUp={followUp} onAnswer={() => {}} />);

    expect(screen.getByText('Do you also have nodal skin eruptions?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('calls onAnswer(true) when Yes is clicked', async () => {
    const onAnswer = vi.fn();
    render(<FollowUpQuestion followUp={followUp} onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) when No is clicked', async () => {
    const onAnswer = vi.fn();
    render(<FollowUpQuestion followUp={followUp} onAnswer={onAnswer} />);

    await userEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('disables both buttons while a previous answer is processing', () => {
    render(<FollowUpQuestion followUp={followUp} onAnswer={() => {}} disabled />);

    expect(screen.getByRole('button', { name: 'Yes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
  });
});
