# Local Setup & Environment Guide

This guide covers local installation, environment configuration, available npm scripts, and common troubleshooting steps for the TrueHire monorepo.

---

## Prerequisites

| Requirement | Version / Notes |
| --- | --- |
| **Node.js** | v20.x (matches `.github/workflows/ci.yml`) |
| **npm** | v10+ |
| **PostgreSQL** | v15+ (local install or Docker via `docker-compose.yml`) |
| **AI Provider** | API key for Groq, NVIDIA NIM, or Google Gemini — or a local [Ollama](https://ollama.com/) instance |

---

## Step-by-Step Setup

### 1. Create environment files

The repository ships a single root template (`.env.example`). Copy it to both the repository root (used by Docker Compose) and `server/.env` (loaded by `dotenv` in `server/src/config/env.ts`):

```bash
cp .env.example .env
cp .env.example server/.env
```

If you are using `docker-compose.yml` for PostgreSQL, add the required Docker variables to root `.env`:

```env
POSTGRES_DB=career_lens
POSTGRES_USER=career_lens_user
POSTGRES_PASSWORD=change_me_local_password
POSTGRES_PORT=5433
```

Make sure the credentials in `DATABASE_URL` (and `DIRECT_URL` if set) in `server/.env` match `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and `POSTGRES_DB`.

### 2. Start PostgreSQL 15

```bash
docker compose up -d postgres
docker compose ps
```

Wait until the `career_lens_postgres` container reports `healthy`.

### 3. Install dependencies

```bash
npm --prefix server install
npm --prefix client install
```

> Running `npm install` at the root also executes the `postinstall` script, which installs both `server/` and `client/` dependencies and runs `prisma:generate`.

### 4. Generate Prisma client, run migrations, and seed jobs

```bash
npm --prefix server run prisma:generate
npx --prefix server prisma migrate deploy
npm --prefix server run prisma:seed
```

`prisma:seed` (`server/prisma/seed.ts`) runs `syncAllSoftwareJobs()` to populate initial active software engineering listings.

### 5. Start the app

```bash
# Runs Express API on :5000 (with startup job sync disabled) and Vite SPA on :3000
npm run dev
```

Or launch each service in its own terminal:

```bash
# Terminal 1 — Express API (http://localhost:5000)
npm run dev:server

# Terminal 2 — Vite Client (http://localhost:3000, proxies /api -> http://localhost:5000)
npm run dev:client
```

Verify the backend health check:

```bash
curl http://localhost:5000/api/health
```

---

## Environment Variables

Server variables are validated at startup by `server/src/config/env.ts` (empty string values like `KEY=""` are stripped before Zod applies defaults).

### Core Runtime & Database

| Variable | Required | Default (`env.ts`) | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production`. Enables fail-closed checks in `production`. |
| `PORT` | No | `5000` | Express server port. |
| `DATABASE_URL` | **Yes (prod)** | `postgresql://career_lens_user:@localhost:5433/career_lens?schema=public` | Must start with `postgresql://` or `postgres://`. Pooled URL in managed Postgres (Supabase/Neon). |
| `DIRECT_URL` | Recommended | Falls back to `DATABASE_URL` | Direct (non-pooled) PostgreSQL URL used by `server/prisma/schema.prisma` for migrations. |
| `CLIENT_URL` | **Yes (prod)** | `http://localhost:3000,http://localhost:5173` | Comma-separated CORS allowlist. Wildcard `*` is rejected in production. |
| `SERVER_URL` | No | `http://localhost:5000` | Public backend URL. |
| `POSTGRES_USER` | Docker only | — (required by `docker-compose.yml`) | PostgreSQL username for local container. |
| `POSTGRES_PASSWORD` | Docker only | — (required by `docker-compose.yml`) | PostgreSQL password for local container. |
| `POSTGRES_DB` | Docker only | `career_lens` | PostgreSQL database name for local container. |
| `POSTGRES_PORT` | Docker only | `5433` | Host port mapped to container port `5432`. |

### Authentication

| Variable | Required | Default (`env.ts`) | Notes |
| --- | --- | --- | --- |
| `JWT_SECRET` | **Yes (prod)** | Dev fallback string | Access token signing secret. Must be >= 32 characters and non-default in production (`openssl rand -hex 32`). |
| `JWT_REFRESH_SECRET` | Recommended | Falls back to `JWT_SECRET` | Separate refresh token signing secret (>= 16 chars; >= 32 recommended in prod). |
| `JWT_EXPIRES_IN` | No | `7d` | Access token TTL. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL. |

### AI Providers

| Variable | Required | Default (`env.ts`) | Notes |
| --- | --- | --- | --- |
| `AI_PROVIDER` | No | `groq` | Primary provider: `groq`, `nvidia`, `gemini`, or `ollama`. |
| `AI_API_KEY` | Optional | — | Shared fallback key if provider-specific key is unset. |
| `AI_BASE_URL` | Optional | Provider default | Optional OpenAI-compatible endpoint override. |
| `AI_MODEL` | Optional | Provider default | Optional primary model override. |
| `AI_TIMEOUT_MS` | No | `60000` | Request timeout in milliseconds (`groqClient`/`geminiClient` default to `45000` if unset in `process.env`). |
| `GROQ_API_KEY` | For Groq | — | Primary Groq key. |
| `GROQ_BASE_URL` | No | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible base URL. |
| `GROQ_MODEL` | No | `qwen/qwen3.8-27b` | Default Groq model tier. |
| `GROQ_FAST_MODEL` | No | `openai/gpt-oss-20b` | Fast tier & intra-Groq fallback model. |
| `GROQ_EVALUATION_MODEL` | No | `openai/gpt-oss-120b` | Evaluation tier model for final interview reports. |
| `NVIDIA_API_KEY` | For NVIDIA | — | NVIDIA NIM API key (also enables NVIDIA as a failover target). |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | NVIDIA NIM endpoint. |
| `NVIDIA_MODEL` | No | `meta/llama-3.3-70b-instruct` in `env.ts` (`nvidia/nemotron-3.5-super-vl-120b-a12b` fallback in `nvidiaClient.ts`) | Set explicitly to pin your NVIDIA model. |
| `GEMINI_API_KEY` | For Gemini | — | Google Gemini API key. |
| `GEMINI_BASE_URL` | No | `https://generativelanguage.googleapis.com/v1beta/openai/` | Gemini OpenAI-compatible endpoint. |
| `GEMINI_MODEL` | No | `gemini-flash-latest` | Default Gemini model. |
| `OLLAMA_BASE_URL` | For Ollama | `http://localhost:11434` | Local Ollama host (`/v1` appended automatically if omitted). |
| `OLLAMA_MODEL` | No | `qwen3:4b` | Local Ollama model tag. |
| `OPENAI_API_KEY` | Optional | — | Legacy fallback key checked only if no provider-specific key is found. |
| `AI_E2E_MOCK` | Tests only | `false` | Enables deterministic mock AI responses in `aiClient.ts`; hard-disabled when `NODE_ENV=production`. |
| `AI_TEST_FAILOVER` | Tests only | `false` | Allows cross-provider failover testing when `NODE_ENV=test`. |

### ATS Job Sync, Monitoring & Client

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `GREENHOUSE_BOARDS` | No | `stripe,razorpay,postman,browserstack,chargebee,druva,clevertap,zerodha,cloudflare,vercel,datadog` | Comma-separated Greenhouse board tokens. |
| `GREENHOUSE_BOARD_TOKEN` | No | `stripe` | Default board token for single-board Greenhouse sync. |
| `GREENHOUSE_COMPANY` | No | `stripe` | Default company label for single-board sync. |
| `GREENHOUSE_API_KEY` | Optional | — | Optional API key for private boards. |
| `LEVER_API_KEY` | Optional | — | Optional Lever API key. |
| `ASHBY_API_KEY` | Optional | — | Optional Ashby API key. |
| `ENABLE_STARTUP_JOB_SYNC` | No | `true` | Set `false` to disable the 15-second post-boot ATS sync (`npm run dev` sets this to `false`). |
| `JOB_SYNC_INTERVAL_HOURS` | No | `6` (`env.ts`) / `24` (`jobSyncScheduler.ts` fallback) | Interval in hours for recurring in-process ATS sync. |
| `SENTRY_DSN` | Optional | — | Server Sentry DSN. Requires installing `@sentry/node` in `server/` (not pre-installed). |
| `VITE_SENTRY_DSN` | Optional | — | Client Sentry DSN. Requires installing `@sentry/react` in `client/` (not pre-installed). |
| `VITE_API_BASE_URL` | Prod client | `/api` (uses Vite dev proxy locally) | Full API base URL for deployed SPA (e.g., `https://truehire-api.onrender.com/api`). |

---

## Available Scripts

### Root (`package.json`)

| Script | Description |
| --- | --- |
| `npm run dev` | Starts Express API (`ENABLE_STARTUP_JOB_SYNC=false`) and Vite SPA (`--port 3000 --host 0.0.0.0`). |
| `npm run dev:server` / `npm run dev:client` | Starts backend or frontend individually. |
| `npm run build` | Compiles both `server/` (`tsc`) and `client/` (`tsc && vite build`). |
| `npm run build:server` / `npm run build:client` | Builds backend or frontend individually. |
| `npm run lint` | Runs TypeScript builds across both workspaces. |
| `npm start` | Starts compiled backend (`node server/dist/index.js`). |
| `npm run test:server` | Runs backend Vitest suite (`server/src/__tests__/`). |
| `npm run test:client` | Runs frontend Vitest unit tests (`client/src/__tests__/`). |
| `npm run test:e2e` | Runs Playwright E2E suite (`client/tests/e2e/`). |

### Workspace-Specific Scripts

- **Server (`server/package.json`):** `dev`, `build`, `start`, `test`, `lint`, `lint:fix`, `format`, `prisma:generate`, `prisma:migrate`, `prisma:seed`, `prisma:push`, `prisma:studio`.
- **Client (`client/package.json`):** `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `lint:fix`, `format`.

---

## Troubleshooting

- **`docker compose up -d postgres` fails with `Set POSTGRES_USER in .env`:**
  `docker-compose.yml` requires `POSTGRES_USER` and `POSTGRES_PASSWORD` to be defined in root `.env`. Add them so they match the user/password in `DATABASE_URL`.
- **Prisma fails with `Environment variable not found: DIRECT_URL`:**
  `server/prisma/schema.prisma` references both `DATABASE_URL` and `DIRECT_URL`. When running Prisma CLI commands directly (`npx --prefix server prisma migrate deploy`), ensure `DIRECT_URL` is uncommented in `server/.env` (it can match `DATABASE_URL` for local Docker Postgres).
- **CORS error (`CORS not allowed`) in the browser:**
  Ensure the browser origin (e.g., `http://localhost:3000`) is listed in `CLIENT_URL` inside `server/.env`, or rely on the Vite `/api` proxy by leaving `VITE_API_BASE_URL` unset during local dev.
- **Playwright E2E tests cannot reach the frontend:**
  `client/vite.config.ts` serves Vite on port `3000`, whereas `client/playwright.config.ts` defaults `PLAYWRIGHT_BASE_URL` to `http://localhost:5173`. Run with `PLAYWRIGHT_BASE_URL=http://localhost:3000` (and ensure `CLIENT_URL` includes `http://localhost:3000`) or start Vite on `5173` when running Playwright locally.
- **Resume upload fails with `NO_READABLE_TEXT`:**
  Scanned image-only PDFs are not supported (there is no OCR fallback). Upload a text-based PDF/DOCX with at least 40 readable non-whitespace characters, or use the paste-text tab (`POST /api/resumes/paste`).
- **Sentry warnings on startup (`@sentry/node is not installed yet`):**
  Both `server/src/config/sentry.ts` and `client/src/lib/sentry.ts` use dynamic imports. Install `@sentry/node` in `server/` and `@sentry/react` in `client/` before setting `SENTRY_DSN` / `VITE_SENTRY_DSN`, or leave those variables unset.

Related docs: [System Architecture](./architecture.md) · [AI Models & Telemetry](./ai-models.md) · [Deployment Guide](./deployment.md)
