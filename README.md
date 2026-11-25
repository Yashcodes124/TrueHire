# TrueHire

An evidence-based interview-readiness platform for software engineers. TrueHire parses resumes, syncs software engineering roles from public ATS boards, scores role fit deterministically against a canonical skill ontology, runs targeted AI mock interviews, and writes verified skill evidence back into the candidate's profile.

---

## Product Preview

![TrueHire Readiness Dashboard](./client/public/landing/dashboard-preview.png)

| Deterministic Job Match | Skill Gap & What-If Simulator |
| :---: | :---: |
| ![Job Match Breakdown](./client/public/landing/match-preview.png) | ![Skill Gap Analysis](./client/public/landing/skill-gap-preview.png) |

| Resume Intelligence | Evidence-Bounded Tailoring |
| :---: | :---: |
| ![Resume Parsing Preview](./client/public/landing/resume-preview.png) | ![Resume Tailoring Workbench](./client/public/landing/tailoring-preview.png) |

---

## The Closed-Loop Workflow

Most interview prep tools treat resume review, job search, and mock interviews as disconnected steps. TrueHire links them into a single data loop where interview performance and submitted skill proofs directly update future match scores and role rankings:

```mermaid
flowchart LR
    A["Resume Upload & Parsing\n(PDF / DOCX / Paste)"] --> B["Verified ATS Job Sync\n(Greenhouse · Lever · Ashby)"]
    B --> C["Deterministic Skill Matching\n& Gap Analysis"]
    C --> D["Targeted AI Mock Interview\n(Adaptive Follow-Ups)"]
    D --> E["Rubric Evaluation\n(5-Dimension Scoring)"]
    E --> F["Evidence-Backed Skill Profile\n(UserSkill STRONG / WEAK)"]
    F -- "Updates defensibility &\nfuture match scores" --> C
```

1. **Resume claims start unverified.** Extracted resume skills are normalized against a shared dictionary of 340+ canonical engineering skills across 9 families.
2. **Matching is 100% deterministic.** No LLM sits in the scoring path—every match percentage, skill gap priority, and defensibility score traces back to explicit job requirements, resume text, or recorded `UserSkill` evidence.
3. **Interviews produce durable evidence.** Completing an interview evaluation (or submitting verifiable skill proof) transactionally upserts `STRONG` or `WEAK` rows in `user_skills`, shifting both Role-Fit Radar rankings and per-job match scores.

---

## Core Capabilities

- **Resume Intelligence:** Upload PDF/DOCX files (<= 5 MB via Multer + `pdf-parse` / `mammoth`) or paste raw text, extract structured sections with Zod-validated LLM output, inspect parse quality scores, re-analyze, or edit parsed sections inline.
- **Multi-ATS Job Discovery:** Sync software engineering roles from public Greenhouse, Lever, and Ashby job boards (plus curated fallback listings), import external job postings with `http:`/`https:` URL validation and HTML sanitization, and bookmark roles.
- **Deterministic Matching & What-If Simulator:** Score resumes against job requirements with exact/alias/evidence breakdowns, offense/defense tactical matrices, `INSUFFICIENT_DATA` detection for underspecified postings, and `POST /api/matches/simulate` score-lift modeling.
- **Role-Fit Radar:** Single-pass deterministic classifier (`GET /api/radar`) that evaluates all active jobs against the candidate's resume and `UserSkill` evidence, grouping opportunities into 5 buckets (`topBestFit`, `oneSkillBreakouts`, `evidenceShifted`, `needsValidation`, `deprioritized`).
- **Evidence-Bounded Tailoring:** Deterministic tailoring workbench (`server/src/services/tailoring/tailoringService.ts`) that identifies skills already supported by resume text, upgrades vague verbs, flags bullets missing metrics, and applies accepted changes without fabricating experience.
- **Adaptive AI Mock Interviews:** Generate custom or role-tailored interview plans, persist raw answers before AI scoring (crash-safe retry on `503 EVALUATION_PENDING`), trigger adaptive follow-up questions on vague/weak/strong answers, and generate 5-dimension rubric evaluations with structured transcripts and Markdown export.
- **Application Tracker:** Track applications across `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, and `REJECTED` states alongside match scores, skill gaps, and linked interview sessions.
- **Skill Ontology:** Inspect canonical skill coverage, family distribution, prerequisite readiness, false-positive audits, and an admin review queue persisted in `ontology_aliases`.
- **Admin Observability (`/admin`):** Role-gated control plane (`requireRole("ADMIN")`) monitoring AI provider latency/fallback/cost (`AiRequestAudit`), ATS sync health (`JobSyncAudit`), resume parse quality (`ResumeParseAudit`), matching coverage, and closed-loop funnel events (`FeatureUsageEvent`).

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend (`client/`)** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router 6, TanStack React Query 5, React Hook Form + Zod, Framer Motion, GSAP, Lenis, Lucide React |
| **Backend (`server/`)** | Node.js 20, Express 4, TypeScript 5, Zod, Helmet, CORS, `express-rate-limit`, Multer 2, `pdf-parse`, `mammoth`, `bcryptjs`, `jsonwebtoken` |
| **Database & ORM** | PostgreSQL 15 + Prisma ORM 5 (`server/prisma/schema.prisma`, 14 models, 7 SQL migrations) |
| **AI Layer** | OpenAI-compatible SDK (`openai` v7) routing across Groq, NVIDIA NIM, Google Gemini, and local Ollama with Zod validation, JSON repair retry, provider failover, and `AiRequestAudit` telemetry |
| **Testing** | Vitest + Supertest (`server/src/__tests__/`), Vitest (`client/src/__tests__/`), Playwright (`client/tests/e2e/`) |
| **CI/CD & Hosting** | GitHub Actions (`.github/workflows/ci.yml`, `cd.yml`, `e2e.yml`), Docker Compose (local Postgres 15), Render (`render.yaml`), Vercel (`client/vercel.json`) |

---

## Quick Start (Local Setup)

### Prerequisites

- **Node.js 20.x** and **npm 10+**
- **PostgreSQL 15+** (local install or Docker via `docker-compose.yml`)
- At least one AI provider key (`GROQ_API_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`) or a local [Ollama](https://ollama.com/) instance

### 1. Configure environment variables

```bash
cp .env.example .env
cp .env.example server/.env
```

Update `.env` and `server/.env`:
- Set `DATABASE_URL` (and optionally `DIRECT_URL`) to match your PostgreSQL credentials.
- If using `docker-compose.yml`, add `POSTGRES_USER` and `POSTGRES_PASSWORD` to root `.env` (required by `docker-compose.yml`) matching the credentials in `DATABASE_URL`.
- Set `AI_PROVIDER` (`groq`, `nvidia`, `gemini`, or `ollama`) and the corresponding API key (e.g., `GROQ_API_KEY`).

### 2. Start PostgreSQL 15 (Docker)

```bash
docker compose up -d postgres
docker compose ps
```

PostgreSQL is exposed on host port `5433` by default (configurable via `POSTGRES_PORT`).

### 3. Install dependencies

```bash
npm --prefix server install
npm --prefix client install
```

### 4. Generate Prisma client, apply migrations, and seed jobs

```bash
npm --prefix server run prisma:generate
npx --prefix server prisma migrate deploy
npm --prefix server run prisma:seed
```

### 5. Start the development servers

```bash
# Starts Express API (port 5000, startup job sync disabled) + Vite SPA (port 3000)
npm run dev
```

Or run them separately:

```bash
npm run dev:server   # Express API on http://localhost:5000
npm run dev:client   # Vite SPA on http://localhost:3000 (proxies /api -> :5000)
```

Verify the API is reachable:

```bash
curl http://localhost:5000/api/health
```

---

## Running Tests

```bash
# Backend unit & integration suites (15 Vitest files, including Supertest route tests)
npm run test:server

# Frontend unit tests (5 Vitest files)
npm run test:client

# Full TypeScript + Vite production build check
npm run build
```

### Playwright End-to-End Tests

Playwright runs 7 specs in `client/tests/e2e/` against PostgreSQL with `AI_E2E_MOCK=true` (deterministic AI mock responses, disabled in production).

```bash
# 1. Install Playwright Chromium once
npx --prefix client playwright install --with-deps chromium

# 2. Push schema to your test database and run E2E suite
# Note: client/vite.config.ts serves on port 3000, while client/playwright.config.ts
# defaults PLAYWRIGHT_BASE_URL to http://localhost:5173 unless overridden.
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

---

## Documentation

| Document | Contents |
| --- | --- |
| [System Architecture](./docs/architecture.md) | System diagram, layered backend (`routes -> controllers -> services -> repositories -> prisma`), frontend feature modules, closed-loop sequence, and AI failover architecture. |
| [API & Data Model](./docs/api-and-data.md) | Complete REST endpoint reference from `server/src/routes/`, JWT access/refresh auth flow, and Prisma schema summary (`server/prisma/schema.prisma`). |
| [Local Setup & Environment](./docs/setup.md) | Detailed local setup, full environment variable reference from `.env.example` and `server/src/config/env.ts`, npm scripts, and troubleshooting. |
| [AI Models & Telemetry](./docs/ai-models.md) | Multi-provider routing (`groq`, `nvidia`, `gemini`, `ollama`), Groq task tiers, JSON repair & Zod validation, and `AiRequestAudit` telemetry. |
| [Deployment Guide](./docs/deployment.md) | Production deployment on Render (`render.yaml`) and Vercel (`client/vercel.json`), fail-closed production env checks, Docker Compose, and GitHub Actions CI/CD. |
