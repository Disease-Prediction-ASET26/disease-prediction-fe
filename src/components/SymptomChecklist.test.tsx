import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { SymptomEntry } from '../domain/assessment';
import { SymptomChecklist } from './SymptomChecklist';

function ControlledChecklist({ onEntries }: { onEntries: (entries: SymptomEntry[]) => void }) {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  return (
    <SymptomChecklist
      value={entries}
      onChange={(next) => {
        setEntries(next);
        onEntries(next);
      }}
    />
  );
}

describe('SymptomChecklist', () => {
  it('labels every checkbox with a human-readable symptom name', () => {
    render(<SymptomChecklist value={[]} onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Cough' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'High fever' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Chest pain' })).toBeInTheDocument();
  });

  it('turns a checked item into a mapped SymptomEntry with the default severity', async () => {
    const onEntries = vi.fn();
    render(<ControlledChecklist onEntries={onEntries} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'High fever' }));

    expect(onEntries).toHaveBeenLastCalledWith([
      { rawText: 'high_fever', severity: 'MODERATE', durationDays: 0, isMapped: true },
    ]);
  });

  it('removes the entry when the item is unchecked', async () => {
    const onEntries = vi.fn();
    render(<ControlledChecklist onEntries={onEntries} />);
    const cough = screen.getByRole('checkbox', { name: 'Cough' });

    await userEvent.click(cough);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Headache' }));
    await userEvent.click(cough);

    expect(onEntries).toHaveBeenLastCalledWith([
      { rawText: 'headache', severity: 'MODERATE', durationDays: 0, isMapped: true },
    ]);
  });

  it('shows a severity select only for checked items and updates that entry', async () => {
    const onEntries = vi.fn();
    render(<ControlledChecklist onEntries={onEntries} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Cough' }));
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Severity of Cough' }),
      'SEVERE',
    );

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(onEntries).toHaveBeenLastCalledWith([
      { rawText: 'cough', severity: 'SEVERE', durationDays: 0, isMapped: true },
    ]);
  });
});
