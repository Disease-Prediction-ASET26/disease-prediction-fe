import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { patientProfile } from './mocks/fixtures';
import {
  backend,
  receivedFollowUpRequests,
  receivedProfileRequests,
  receivedRequests,
} from './mocks/handlers';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  receivedRequests.length = 0;
  receivedFollowUpRequests.length = 0;
  receivedProfileRequests.length = 0;
  backend.profile = { ...patientProfile };
});

afterAll(() => server.close());
