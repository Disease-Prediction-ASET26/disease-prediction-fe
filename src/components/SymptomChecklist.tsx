import { useId } from 'react';
import type { Severity, SymptomEntry } from '../domain/assessment';
import type { SymptomOption } from '../domain/symptoms';
import { CHECKLIST_SYMPTOMS, toSymptomEntry } from '../domain/symptoms';
import { SeveritySelect } from './SeveritySelect';

export interface SymptomChecklistProps {
  /** The current selection, as the `symptomEntries` that will be sent. */
  value: SymptomEntry[];
  onChange: (entries: SymptomEntry[]) => void;
  options?: readonly SymptomOption[];
  disabled?: boolean;
}

/** FR-P1: structured checklist of known symptoms, each checked item with its own severity. */
export function SymptomChecklist({
  value,
  onChange,
  options = CHECKLIST_SYMPTOMS,
  disabled = false,
}: SymptomChecklistProps) {
  const groupId = useId();
  const selected = new Map(value.map((entry) => [entry.rawText, entry]));

  const toggle = (option: SymptomOption) => {
    if (selected.has(option.id)) {
      onChange(value.filter((entry) => entry.rawText !== option.id));
    } else {
      onChange([...value, toSymptomEntry(option)]);
    }
  };

  const changeSeverity = (option: SymptomOption, severity: Severity) => {
    onChange(value.map((entry) => (entry.rawText === option.id ? { ...entry, severity } : entry)));
  };

  return (
    <fieldset className="field checklist">
      <legend>Or select symptoms from the list</legend>
      <ul>
        {options.map((option) => {
          const entry = selected.get(option.id);
          const checkboxId = `${groupId}-${option.id}`;
          return (
            <li key={option.id} className={entry ? 'checklist-item is-checked' : 'checklist-item'}>
              <input
                type="checkbox"
                id={checkboxId}
                checked={entry !== undefined}
                disabled={disabled}
                onChange={() => toggle(option)}
              />
              <label htmlFor={checkboxId}>{option.label}</label>
              {entry && (
                <SeveritySelect
                  symptomLabel={option.label}
                  value={entry.severity}
                  disabled={disabled}
                  onChange={(severity) => changeSeverity(option, severity)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
