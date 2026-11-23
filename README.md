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

## Sign-in (Hanko)

Every backend call needs a signed-in user (MDD Iteration 6). Hanko Elements (`<hanko-auth>`)
handles registration and login; the Hanko SDK keeps the session token, and the API clients send it
as `Authorization: Bearer <token>`. A 401 from the backend signs the user out.

The login page offers email and Google first. After entering an email, users can choose a passcode,
password or passkey. The browser may still offer saved passkeys through autofill on the email field.

Routes: `/login` (public), `/onboarding` (first login: name, optional date of birth, consent),
`/account` (profile, consent, sign-in methods, sign out). The assessment routes need a finished
profile and an active consent; the home page stays public. Route guards only shape the UI: the
backend checks the token on every request.

In the deployed Hanko configuration, an account created with email cannot be connected to
Google. Use email to sign in to that account. An account created with Google can also use
email sign-in with the same address. Automatic account linking is disabled.

If the backend reports an unverified primary email, the app opens Hanko's sign-in settings so
the user can verify it. The user then signs out and signs in again to obtain a session with an
updated email claim. If sign-out fails, the app warns that the server session may still be active
and offers a retry. Keep the page open while retrying: the retry token is held in memory only.

Hanko Elements stores its session token in a JavaScript-readable cookie on the app origin so the
app can send it to the backend. An injected script could read this token. A backend session with
an HttpOnly cookie would need changes to the authentication flow and CSRF protection.

For local development, start the backend's Docker Compose stack (`disease-prediction-be`,
`docker compose up -d`). It runs Hanko on `http://localhost:8100`, the default here, and Mailpit
on `http://localhost:8025`, where the sign-in passcodes arrive. Passkeys work on
`http://localhost:5173`. The Docker images set `VITE_HANKO_API_URL` to the dev
(`Dockerfile.dev`) and production (`Dockerfile.prod`) Hanko.

## Docker

The three Dockerfiles run the same frontend in different ways:

| File               | Use                                         | Container port |
| ------------------ | ------------------------------------------- | -------------- |
| `Dockerfile.local` | Vite development server and frontend tests. | 5173           |
| `Dockerfile.dev`   | Static Nginx image with source maps.        | 8080           |
| `Dockerfile.prod`  | Static Nginx image without source maps.     | 8080           |

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

`VITE_API_BASE_URL` and `VITE_HANKO_API_URL` are build-time values; changing them requires a
rebuild.
`API_UPSTREAM` is a runtime value for the Nginx images and defaults to
`http://backend:8080`. Keep `VITE_API_BASE_URL` empty to use the same-origin
`/api` proxy. Do not put secrets in `VITE_` values: they are in the browser
bundle.

The development Nginx image enforces a Content Security Policy (CSP). The production image
defaults to report-only. To change the mode, set `CSP_HEADER_NAME` at runtime to either
`Content-Security-Policy` or `Content-Security-Policy-Report-Only` and restart the container.
The policy permits the Hanko origin set by `VITE_HANKO_API_URL` at build time. You can override
that origin with `CSP_HANKO_ORIGIN` at runtime; this does not change the frontend bundle. If
`VITE_API_BASE_URL` points to another origin, update the policy before enforcement.

Nginx generates a cryptographically random script nonce for each request. It returns HTTP 503
if nonce generation fails. Cloudflare uses the nonce for its injected security script. HTML
responses use `no-store` so a cached response cannot reuse the nonce. The policy permits inline
styles for Hanko Elements. Production remains report-only until registration, Google login, passkeys,
profile settings and logout have been checked in that environment. Report-only violations appear
in the browser console; the app does not collect reports.

To check the policy headers locally, run from this repository root:

```bash
docker build -f Dockerfile.dev -t pocket-csp-frontend:dev .
docker build -f Dockerfile.prod -t pocket-csp-frontend:prod .
python3 tests/csp_headers.py
```

These checks do not replace a browser test through Cloudflare and Hanko.

## CI image versions

The shared CI workflow reads the frontend's SemVer version from `package.json`. Keep the
`package.json` and `package-lock.json` versions in sync. CI publishes `X.Y.Z` from `main`; bump
the version before merging a change that needs a new production image. On `develop`, CI publishes
`X.Y.Z-dev.<shortsha>.<run>.<attempt>`. Pull requests use
`X.Y.Z-pr.<number>.<shortsha>.<run>.<attempt>`. GitOps deploys the readable tag with its SHA-256
digest, for example `ghcr.io/disease-prediction-aset26/disease-prediction-fe:0.1.0@sha256:<digest>`.

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
├─ components/    SymptomFreeTextInput, SymptomChecklist, PredictionResultView, EmergencyBanner
├─ pages/         AssessmentPage
├─ routing/       route model, RootLayout, guards, routes (home, login, onboarding, account, assessment, result, emergency, 404)
└─ test/          test setup + MSW handlers/fixtures
```

## User interface

The app uses Radix Themes for shared interface components and Lucide for icons. The theme follows the system color preference until the user selects light or dark with the header
control. That choice is stored in browser local storage. The theme is configured in
`src/AppProviders.tsx`; the theme's token and component
stylesheets are loaded before `src/styles.css`. Add the Radix layout or utility stylesheets only
when using those features. The app's CSS variables define the Pocket Doc palette for existing
components and Hanko Elements. See [the design guide](DESIGN.md) before adding or changing UI.

The landing page uses public-domain vector illustrations: [Stethoscope by oksmith](https://openclipart.org/detail/314248/stethoscope)
(adapted and recolored), [Ginkgo Leaf by j4p4n](https://openclipart.org/detail/290887/gingko-leaf-green), and
[Fern Leaf Silhouette by GDJ](https://openclipart.org/detail/314892) (recolored).
The self-hosted Cormorant Garamond font is under the [SIL Open Font License](src/assets/fonts/OFL.txt).

Radix Themes ships a shared stylesheet. Check the production build's compressed CSS and JavaScript
sizes with `npm run build` when adding components or dependencies. Prefer CSS for simple transitions
and respect the reduced-motion setting.

## Model-driven development docs

Diagrams and model-to-code traceability live in the docs repository,
[`disease-prediction-docs`](https://github.com/Disease-Prediction-ASET26/disease-prediction-docs),
under `mdd/iteration3/` (prediction feature), `mdd/iteration4/` (client-side routing) and
`mdd/iteration6/` (sign-in with Hanko).

Branching follows GitFlow: feature branches → `develop`; only `develop` → `main`.
