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

/**
 * The backend refused the request for a reason the user can act on (a 4xx problem response with a
 * `code`, MDD Iteration 6): no profile yet, no consent, wrong role, session ended.
 */
export class ApiProblemError extends Error {
  readonly kind = 'problem' as const;
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = 'ApiProblemError';
    this.code = code;
    this.status = status;
  }
}

/** The stored assessment does not exist or belongs to someone else (HTTP 404). */
export class AssessmentNotFoundError extends Error {
  readonly kind = 'not-found' as const;

  constructor(message = 'We could not find this assessment.') {
    super(message);
    this.name = 'AssessmentNotFoundError';
  }
}

export type AssessmentError =
  ValidationError | UnrecognizedSymptomsError | NetworkError | ApiProblemError;
