import type { PredictionResult } from '../domain/assessment';
import { formatProbability } from '../domain/format';
import { toDisplayName } from '../domain/symptoms';

export interface PredictionResultViewProps {
  result: PredictionResult;
}

/**
 * FR-P2 / FR-P3: shows the single most likely condition only, with its probability, the symptoms
 * that drove the prediction, a description and recommended precautions. Lower-ranked predictions
 * are intentionally not shown.
 */
export function PredictionResultView({ result }: PredictionResultViewProps) {
  const topPrediction = result.predictions.reduce<(typeof result.predictions)[number] | null>(
    (best, current) => (best === null || current.rank < best.rank ? current : best),
    null,
  );

  const weights = Object.entries(topPrediction?.explanation?.contributionWeights ?? {}).sort(
    ([, a], [, b]) => b - a,
  );
  const precautions = topPrediction?.precautions ?? [];

  return (
    <section className="result" aria-labelledby="result-heading">
      <h2 id="result-heading">Most likely condition</h2>

      {topPrediction === null ? (
        <p>No likely conditions were identified from the symptoms provided.</p>
      ) : (
        <article className="prediction result-card">
          <div className="prediction-header">
            <h3>{topPrediction.diseaseName}</h3>
            <span
              className="prediction-probability"
              aria-label={`Probability ${formatProbability(topPrediction.probability)}`}
            >
              {formatProbability(topPrediction.probability)}
            </span>
          </div>

          {topPrediction.description && (
            <p className="prediction-description">{topPrediction.description}</p>
          )}

          {topPrediction.explanation?.summary && <p>{topPrediction.explanation.summary}</p>}

          {weights.length > 0 && (
            <>
              <h4>Contributing symptoms</h4>
              <ul
                className="contributions"
                aria-label={`Contributing symptoms for ${topPrediction.diseaseName}`}
              >
                {weights.map(([symptom, weight]) => (
                  <li key={symptom}>
                    {toDisplayName(symptom)}{' '}
                    <span className="weight">{formatProbability(weight)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {precautions.length > 0 && (
            <>
              <h4>Precautions</h4>
              <ul
                className="precautions"
                aria-label={`Precautions for ${topPrediction.diseaseName}`}
              >
                {precautions.map((precaution) => (
                  <li key={precaution}>{precaution}</li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}

      <p className="disclaimer" role="note">
        {result.disclaimer || 'This is not a medical diagnosis.'}
      </p>
    </section>
  );
}
