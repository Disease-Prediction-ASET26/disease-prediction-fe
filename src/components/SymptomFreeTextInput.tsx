import { useId } from 'react';

export interface SymptomFreeTextInputProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

/** FR-P1: free-text description of symptoms. The backend's NLP parser maps it to symptoms. */
export function SymptomFreeTextInput({
  value,
  onChange,
  disabled = false,
}: SymptomFreeTextInputProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="field">
      <label htmlFor={id}>Describe your symptoms</label>
      <p id={hintId} className="field-hint">
        In your own words — for example, &ldquo;I have had a dry cough and a headache since
        Monday.&rdquo;
      </p>
      <textarea
        id={id}
        aria-describedby={hintId}
        rows={5}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
