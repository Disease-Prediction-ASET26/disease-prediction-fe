/**
 * Error taxonomy of the API client layer. The view only needs to know whether the problem was the
 * patient's input (fix and resubmit) or the connection/server (retry).
 */

/** The backend rejected the payload (HTTP 400). */
export class ValidationError extends Error {
  readonly kind = 'validation' as const;

  constructor(message = 'Please describe at least one symptom before submitting.') {
    super(message);
    this.name = 'ValidationError';
  }
}

/** The prediction service did not recognise any supported symptoms (HTTP 422). */
export class UnrecognizedSymptomsError extends Error {
  readonly kind = 'unrecognized' as const;

  constructor(
    message = 'We could not identify a supported symptom. Add more detail or choose symptoms from the list.',
  ) {
    super(message);
    this.name = 'UnrecognizedSymptomsError';
  }
}

/** The request did not complete: network failure, 5xx, or an unreadable response. Retryable. */
export class NetworkError extends Error {
  readonly kind = 'network' as const;
  readonly status?: number;

  constructor(
    message = 'We could not reach the assessment service. Please try again.',
    status?: number,
  ) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
  }
}

export type AssessmentError = ValidationError | UnrecognizedSymptomsError | NetworkError;
