import { useId } from 'react';
import type { SymptomEntry } from '../domain/assessment';
import type { SymptomGroup, SymptomOption } from '../domain/symptoms';
import { SYMPTOM_GROUPS, toSymptomEntry } from '../domain/symptoms';

export interface SymptomChecklistProps {
  /** The current selection, as the `symptomEntries` that will be sent. */
  value: SymptomEntry[];
  onChange: (entries: SymptomEntry[]) => void;
  groups?: readonly SymptomGroup[];
  disabled?: boolean;
}

/** FR-P1: structured checklist of known symptoms, grouped by body system. */
export function SymptomChecklist({
  value,
  onChange,
  groups = SYMPTOM_GROUPS,
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

  return (
    <fieldset className="field checklist">
      <legend>Or select symptoms from the list</legend>
      {groups.map((group) => (
        <div key={group.title} className="checklist-group">
          <h3 className="checklist-group-title">{group.title}</h3>
          <ul>
            {group.options.map((option) => {
              const entry = selected.get(option.id);
              const checkboxId = `${groupId}-${option.id}`;
              return (
                <li
                  key={option.id}
                  className={entry ? 'checklist-item is-checked' : 'checklist-item'}
                >
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={entry !== undefined}
                    disabled={disabled}
                    onChange={() => toggle(option)}
                  />
                  <label htmlFor={checkboxId}>{option.label}</label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </fieldset>
  );
}
