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

In dev, the app calls same-origin `/api/...` and Vite proxies it to the backend at
`VITE_API_PROXY_TARGET` (default `http://localhost:8080`). Start the backend from
`disease-prediction-be` with `./mvnw spring-boot:run`. To override a default, put the variable
in a local `.env` file (git-ignored).

## Docker

The three Dockerfiles run the same frontend in different ways:

| File | Use | Container port |
| --- | --- | --- |
| `Dockerfile.local` | Vite development server and frontend tests. | 5173 |
| `Dockerfile.dev` | Static Nginx image with source maps. | 8080 |
| `Dockerfile.prod` | Static Nginx image without source maps. | 8080 |

### Run the full stack

Use the [shared Docker setup](https://github.com/Disease-Prediction-ASET26/disease-prediction-docker)
to configure the database, model files, and local secrets. Keep the repositories
as sibling directories. From `disease-prediction-docker`, run:

```bash
docker compose --profile local up --build
```

Open `http://localhost:5173`. The local profile mounts the frontend source and
Vite reloads changes. Run frontend tests in another terminal:

```bash
docker compose exec frontend-local npm test
docker compose exec frontend-local npm run test:integration
```

For the built dev or production images, run one of these commands:

```bash
docker compose --profile dev up --build
docker compose --profile prod up --build
```

Their frontend ports are `18081` and `28081`. To stop the local stack, run:

```bash
docker compose --profile local down
```

Use the matching profile for the other stacks. Data is kept.

### Build and run a frontend image

From this repository, build an image:

```bash
docker build -f Dockerfile.dev -t disease-prediction-fe:dev .
docker build -f Dockerfile.prod -t disease-prediction-fe:prod .
```

To check the dev image with a backend running on the Docker host:

```bash
docker run --rm --name frontend-check \
  --add-host host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:8080 \
  -p 127.0.0.1:18081:8080 disease-prediction-fe:dev
```

Open `http://localhost:18081`. The page can load without the backend; API
requests need a backend reachable at the configured address. Stop the container
with Ctrl+C. Replace `:dev` with `:prod` to check the production image.

For an image with the Vite development server and test dependencies:

```bash
docker build -f Dockerfile.local -t disease-prediction-fe:local .
docker run --rm disease-prediction-fe:local npm test
```

`VITE_API_BASE_URL` is a build-time value; changing it requires a rebuild.
`API_UPSTREAM` is a runtime value for the Nginx images and defaults to
`http://backend:8080`. Keep `VITE_API_BASE_URL` empty to use the same-origin
`/api` proxy. Do not put secrets in `VITE_` values: they are in the browser
bundle.

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

## Layout

```
src/
├─ domain/        TS mirrors of the backend DTOs, symptom vocabulary, formatting
├─ api/           AssessmentApiClient port, HttpAssessmentApiClient adapter, errors, DI context
├─ application/   useAssessment hook (request building, status machine)
├─ components/    SymptomFreeTextInput, SymptomChecklist, SeveritySelect, PredictionResultView, EmergencyBanner
├─ pages/         AssessmentPage
├─ routing/       route model, RootLayout, route components (home, assessment, result, emergency, 404)
└─ test/          test setup + MSW handlers/fixtures
```

## Model-driven development docs

Diagrams and model-to-code traceability live in the docs repository,
[`disease-prediction-docs`](https://github.com/Disease-Prediction-ASET26/disease-prediction-docs),
under `mdd/iteration3/` (prediction feature) and `mdd/iteration4/` (client-side routing).

Branching follows GitFlow: feature branches → `develop`; only `develop` → `main`.
