import type { FollowUp } from '../domain/assessment';

export interface FollowUpQuestionProps {
  followUp: FollowUp;
  /** Called with the patient's answer: true = yes, false = no. */
  onAnswer: (present: boolean) => void;
  /** True while the previous answer is being processed; disables the buttons. */
  disabled?: boolean;
}

/**
 * FR-P3 adaptive questioning. When a prediction is below the confidence threshold the service asks
 * one yes/no question about a characteristic symptom; the patient's answer sharpens the next
 * prediction. Rendered on the assessment page between submissions; the loop ends when the result
 * no longer needs a follow-up.
 */
export function FollowUpQuestion({ followUp, onAnswer, disabled = false }: FollowUpQuestionProps) {
  return (
    <section className="follow-up" aria-labelledby="follow-up-heading">
      <h2 id="follow-up-heading" className="follow-up-heading">
        One more question
      </h2>
      <p className="follow-up-question">{followUp.question}</p>
      <div className="follow-up-actions">
        <button type="button" onClick={() => onAnswer(true)} disabled={disabled}>
          Yes
        </button>
        <button type="button" onClick={() => onAnswer(false)} disabled={disabled}>
          No
        </button>
      </div>
    </section>
  );
}
