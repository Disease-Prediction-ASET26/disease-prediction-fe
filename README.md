# disease-prediction-fe — Patient Web App

React + TypeScript frontend for the Disease Prediction system (C4 container "Patient Web App").
Patients describe their symptoms in free text and/or a checklist, submit an assessment to the
Java backend (`POST /api/assessments`), and see ranked predictions — or an emergency alert.

```
Patient → Patient Web App (this repo) → POST /api/assessments → API Backend (disease-prediction-be)
                                                                   → POST /predict → Prediction Service (disease-prediction-ai)
```

## Getting started

Requires Node.js 20+ (CI uses Node 22) and npm.

```bash
npm ci
cp .env.example .env.local   # optional; defaults work for local dev
npm run dev                  # http://localhost:5173
```

In dev, the app calls same-origin `/api/...` and Vite proxies it to the backend at
`VITE_API_PROXY_TARGET` (default `http://localhost:8080`). Start the backend from
`disease-prediction-be` with `./mvnw spring-boot:run`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with the `/api` proxy |
| `npm run build` | Type-check and build the production bundle into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | ESLint (no warnings allowed) |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Unit tests (Vitest + React Testing Library) |
| `npm run test:integration` | Integration tests (page + hook + HTTP client against MSW) |
| `npm run coverage` | All tests with coverage → `coverage/lcov.info` |
| `npm run audit` | `npm audit --audit-level=high` |

## Configuration

| Variable | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | browser bundle (build time) | empty | Backend origin. Empty = same-origin `/api`. |
| `VITE_API_PROXY_TARGET` | Vite dev server | `http://localhost:8080` | Where `/api` is proxied in dev. |

## Container

```bash
docker build -t disease-prediction-fe .
docker run -p 8080:8080 disease-prediction-fe
```

Multi-stage build: `node:22-alpine` builds the bundle, `nginx-unprivileged` serves `dist/` on
port 8080. Pass `--build-arg VITE_API_BASE_URL=https://api.example.test` to point the bundle at a
backend on another origin.

## Layout

```
src/
├─ domain/        TS mirrors of the backend DTOs, symptom vocabulary, formatting
├─ api/           AssessmentApiClient port, HttpAssessmentApiClient adapter, errors, DI context
├─ application/   useAssessment hook (request building, status machine)
├─ components/    SymptomFreeTextInput, SymptomChecklist, SeveritySelect, PredictionResultView, EmergencyBanner
├─ pages/         AssessmentPage
└─ test/          test setup + MSW handlers/fixtures
```

## Model-driven development docs

- Iteration 3 (prediction feature): [`docs/diagrams/iteration3/`](docs/diagrams/iteration3/README.md)

Branching follows GitFlow: feature branches → `develop`; only `develop` → `main`.
