const percentFormat = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });

/** Probability (0..1) as a whole percentage; clamps out-of-range values from the wire. */
export function formatProbability(probability: number): string {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(probability) ? probability : 0));
  return percentFormat.format(clamped);
}
