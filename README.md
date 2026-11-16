# disease-prediction-fe — Patient Web App

React + TypeScript frontend for the Disease Prediction system (C4 container "Patient Web App").
Patients describe their symptoms in free text and/or a checklist, submit an assessment to the
Java backend (`POST /api/assessments`), and see ranked predictions — or an emergency alert.

Routes: `/` (home), `/assessment` (form), `/assessment/result`, `/assessment/emergency`, and a
not-found fallback. Result and emergency views need the submitted assessment in router state;
opened directly, they redirect to the form.

```
Patient → Patient Web App (this repo) → POST /api/assessments → API Backend (disease-prediction-be)
                                                                   → POST /predict → Prediction Service (disease-prediction-ai)
```

## Getting started

Requires Node.js 20+ and npm.

```bash
npm ci
npm run dev                  # http://localhost:5173
```

For the full stack in Docker, use the sibling
[`disease-prediction-docker`](../disease-prediction-docker) repository. Its
`local` profile mounts this source into Vite; `dev` and `prod` build a static
Nginx image that proxies `/api` to the backend service. The production image
uses the same-origin API path by default, so set `API_UPSTREAM` to the backend
service URL when its cluster service name differs. The Nginx runtime stage
uses a pinned unprivileged image and applies available Alpine security updates
at build time.

In dev, the app calls same-origin `/api/...` and Vite proxies it to the backend at
`VITE_API_PROXY_TARGET` (default `http://localhost:8080`). Start the backend from
`disease-prediction-be` with `./mvnw spring-boot:run`. To override a default, put the variable
in a local `.env` file (git-ignored).

## Sign-in (Hanko)

Every backend call needs a signed-in user (MDD Iteration 6). Hanko Elements (`<hanko-auth>`)
handles registration and login; the Hanko SDK keeps the session token, and the API clients send it
as `Authorization: Bearer <token>`. A 401 from the backend signs the user out.

Routes: `/login` (public), `/onboarding` (first login: name, optional date of birth, consent),
`/account` (profile, consent, sign-in methods, sign out). The assessment routes need a finished
profile and an active consent; the home page stays public. Route guards only shape the UI: the
backend checks the token on every request.

For local development, start the backend's Docker Compose stack (`disease-prediction-be`,
`docker compose up -d`). It runs Hanko on `http://localhost:8100`, the default here, and Mailpit
on `http://localhost:8025`, where the sign-in passcodes arrive. Passkeys work on
`http://localhost:5173`. The Docker images set `VITE_HANKO_API_URL` to the dev
(`Dockerfile.dev`) and production (`Dockerfile.prod`) Hanko.

## Scripts

| Script                            | What it does                                              |
| --------------------------------- | --------------------------------------------------------- |
| `npm run dev`                     | Vite dev server with the `/api` proxy                     |
| `npm run build`                   | Type-check and build the production bundle into `dist/`   |
| `npm run preview`                 | Serve the built bundle locally                            |
| `npm run lint`                    | ESLint (no warnings allowed)                              |
| `npm run format` / `format:check` | Prettier                                                  |
| `npm test`                        | Unit tests (Vitest + React Testing Library)               |
| `npm run test:integration`        | Integration tests (page + hook + HTTP client against MSW) |
| `npm run coverage`                | All tests with coverage → `coverage/lcov.info`            |
| `npm run audit`                   | `npm audit --audit-level=high`                            |

## Configuration

| Variable                | Used by                     | Default                 | Meaning                                     |
| ----------------------- | --------------------------- | ----------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL`     | browser bundle (build time) | empty                   | Backend origin. Empty = same-origin `/api`. |
| `VITE_API_PROXY_TARGET` | Vite dev server             | `http://localhost:8080` | Where `/api` is proxied in dev.             |
| `VITE_HANKO_API_URL`    | browser bundle (build time) | `http://localhost:8100` | Hanko public API used for sign-in.          |

## Layout

```
src/
├─ domain/        TS mirrors of the backend DTOs, symptom vocabulary, formatting
├─ auth/          AuthClient port, HankoAuthClient adapter, AuthProvider (session state)
├─ api/           Assessment and Profile API ports + HTTP adapters, authorized fetch, errors
├─ application/   useAssessment hook, ProfileProvider (profile + consent state)
├─ components/    SymptomFreeTextInput, SymptomChecklist, SeveritySelect, PredictionResultView, EmergencyBanner
├─ pages/         AssessmentPage
├─ routing/       route model, RootLayout, guards, routes (home, login, onboarding, account, assessment, result, emergency, 404)
└─ test/          test setup + MSW handlers/fixtures
```

## Model-driven development docs

Diagrams and model-to-code traceability live in the docs repository,
[`disease-prediction-docs`](https://github.com/Disease-Prediction-ASET26/disease-prediction-docs),
under `mdd/iteration3/` (prediction feature), `mdd/iteration4/` (client-side routing) and
`mdd/iteration6/` (sign-in with Hanko).

Branching follows GitFlow: feature branches → `develop`; only `develop` → `main`.
