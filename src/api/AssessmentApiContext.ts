import { createContext, useContext } from 'react';
import type { AssessmentApiClient } from './AssessmentApiClient';
import { HttpAssessmentApiClient } from './HttpAssessmentApiClient';

/**
 * Dependency-injection seam for the `AssessmentApiClient` port. The default value is the HTTP
 * adapter; tests or a future mock mode wrap the tree in `AssessmentApiContext.Provider`.
 */
export const AssessmentApiContext = createContext<AssessmentApiClient>(
  new HttpAssessmentApiClient(),
);

export function useAssessmentApiClient(): AssessmentApiClient {
  return useContext(AssessmentApiContext);
}
