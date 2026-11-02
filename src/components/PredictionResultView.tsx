import type { PredictionResult } from '../domain/assessment';
import { formatProbability } from '../domain/format';
import { toDisplayName } from '../domain/symptoms';

export interface PredictionResultViewProps {
  result: PredictionResult;
}

/** FR-P2 / FR-P3: ranked likely conditions with probability, explanation and the disclaimer. */
export function PredictionResultView({ result }: PredictionResultViewProps) {
  const predictions = [...result.predictions].sort((a, b) => a.rank - b.rank);

  return (
    <section className="result" aria-labelledby="result-heading">
      <h2 id="result-heading">Possible conditions</h2>

      {predictions.length === 0 ? (
        <p>No likely conditions were identified from the symptoms provided.</p>
      ) : (
        <ol className="prediction-list">
          {predictions.map((prediction) => {
            const weights = Object.entries(prediction.explanation?.contributionWeights ?? {}).sort(
              ([, a], [, b]) => b - a,
            );
            return (
              <li key={`${prediction.rank}-${prediction.diseaseName}`} className="prediction">
                <div className="prediction-header">
                  <span className="prediction-rank">#{prediction.rank}</span>
                  <h3>{prediction.diseaseName}</h3>
                  <span
                    className="prediction-probability"
                    aria-label={`Probability ${formatProbability(prediction.probability)}`}
                  >
                    {formatProbability(prediction.probability)}
                  </span>
                </div>
                {prediction.explanation?.summary && <p>{prediction.explanation.summary}</p>}
                {weights.length > 0 && (
                  <ul
                    className="contributions"
                    aria-label={`Contributing symptoms for ${prediction.diseaseName}`}
                  >
                    {weights.map(([symptom, weight]) => (
                      <li key={symptom}>
                        {toDisplayName(symptom)}{' '}
                        <span className="weight">{formatProbability(weight)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <p className="disclaimer" role="note">
        {result.disclaimer || 'This is not a medical diagnosis.'}
      </p>
    </section>
  );
}
