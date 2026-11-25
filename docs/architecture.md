# System Architecture

TrueHire (`career-lens-monorepo`) is a full-stack TypeScript monorepo consisting of a React SPA (`client/`) and an Express REST API (`server/`) backed by PostgreSQL 15 via Prisma ORM.

---

## High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend SPA (client/ · React 18 + Vite)"]
        UI["Feature Pages & AppShell\n(Lazy-loaded routes + ErrorBoundary)"]
        RQ["TanStack React Query + apiClient\n(Bearer JWT + auto refresh rotation)"]
        UI --> RQ
    end

    subgraph Server["Backend API (server/ · Node 20 + Express 4)"]
        MW["Middleware Pipeline\nHelmet · CORS · Rate Limiters · JWT Auth · RBAC · Multer"]
        RT["Routes (10 domain routers under /api/*)"]
        CT["Controllers (HTTP validation & serialization)"]
        SV["Services (Domain logic & deterministic engines)"]
        RP["Repositories (Prisma queries & transactions)"]
        MW --> RT --> CT --> SV --> RP
    end

    subgraph External["External Integrations"]
        AI["Multi-Provider AI Router\nGroq · NVIDIA NIM · Gemini · Ollama"]
        ATS["Public ATS Connectors\nGreenhouse · Lever · Ashby"]
    end

    DB[("PostgreSQL 15\nPrisma ORM (14 models)")]

    RQ -- "HTTPS JSON / multipart" --> MW
    RP <--> DB
    SV -- "Structured JSON prompts +\nZod validation + AiRequestAudit" --> AI
    SV -- "Scheduled & Admin Sync +\nJobSyncAudit" --> ATS
```

---

## Layered Backend Architecture (`server/src/`)

Every HTTP request follows a strict one-way layering discipline so transport concerns stay separate from domain logic and SQL persistence:

```text
routes -> controllers -> services -> repositories -> prisma
```

| Layer | Directory | Responsibility |
| --- | --- | --- |
| **App & Config** | `src/app.ts`, `src/index.ts`, `src/config/` | Express setup (`trust proxy`, Helmet, CORS allowlist, centralized `AppError`/Zod/Multer error handler), Zod env validation (`env.ts`), Prisma singleton (`db.ts`), optional Sentry hooks (`sentry.ts`), ontology DB hydration, and background job sync scheduler. |
| **Middleware** | `src/middleware/` | `authMiddleware.ts` (JWT verification rejecting refresh tokens), `requireRole.ts` (`ADMIN` guard), `rateLimit.ts` (5 tiers: global, auth, upload, AI, admin), `uploadMiddleware.ts` (Multer in-memory 5 MB PDF/DOCX filter on field `resume`). |
| **Routes** | `src/routes/` | 10 Express routers mounted in `app.ts`: `admin`, `auth`, `resumes`, `jobs`, `matches`, `interviews`, `applications`, `readiness`, `ontology`, `radar`. |
| **Controllers** | `src/controllers/` | Parse params/body, enforce request-level input checks, invoke services, and format JSON responses. |
| **Services** | `src/services/` | Core business rules: resume extraction/quality scoring, deterministic skill ontology & matching (`matching/`), Role-Fit Radar, evidence-bounded tailoring (`tailoring/`), interview orchestration & adaptive follow-ups, readiness rule engine (`readiness/`), skill evidence mapping (`skills/`), ATS sync (`greenhouseSyncService.ts`), admin analytics (`admin/`), and telemetry (`telemetry/`). |
| **Repositories** | `src/repositories/` | 8 Prisma data-access modules (`application`, `interview`, `job`, `match`, `resume`, `savedJob`, `skill`, `user`), enforcing user-scoped queries and atomic transactions (e.g., `saveEvaluationWithSkillEvidence`). |
| **Integrations** | `src/integrations/` | Multi-provider OpenAI-compatible AI router (`ai/`) and ATS board clients/adapters/Zod schemas (`jobs/greenhouse/`, `jobs/lever/`, `jobs/ashby/`). |
| **Modules** | `src/modules/` | Prompt builders, adaptive interviewer helpers, and Zod output schemas for interview plans, questions, per-question evaluations (`interview/`), and final rubric reports (`evaluation/`). |

### Deterministic vs. AI Boundaries

TrueHire intentionally keeps critical scoring paths deterministic and reserves LLMs for unstructured extraction and open-ended interview reasoning:

- **Deterministic (zero LLM calls):**
  - Skill extraction & normalization (`skillDictionary.ts`, `skillNormalizer.ts`, `jobSkillExtractor.ts` — 340+ canonical skills across 9 families with whole-word boundary matching)
  - Resume-to-job match scoring, skill gap prioritization, offense/defense tactical matrix, and what-if simulation (`matchingService.ts`, `matchService.ts`)
  - Role-Fit Radar 5-bucket classification (`roleFitRadarService.ts`)
  - Evidence-bounded resume tailoring (`tailoringService.ts`)
  - Readiness defensibility scoring and next-action rule engine (`readinessService.ts`, `nextAction.ts`)
  - Interview report-to-`UserSkill` evidence mapping (`skillEvidence.ts`)
- **AI-assisted (Zod-validated + audited):**
  - Resume structure extraction (`RESUME_ANALYSIS`)
  - Default interview plan generation & question generation (`INTERVIEW_GENERATION`)
  - Per-question answer evaluation (`INTERVIEW_ANSWER_EVAL`) and adaptive follow-up generation (with deterministic template fallback)
  - Final 5-dimension rubric evaluation (`INTERVIEW_FINAL_EVAL`)

---

## Frontend Architecture (`client/src/`)

The client is a Vite + React 18 SPA organized by product domain (`src/features/`), with route-level `React.lazy` code splitting and manual Rollup vendor chunks (`react-vendor`, `query-vendor`, `motion-vendor`, `icons-vendor`, `sentry-vendor`) in `client/vite.config.ts`.

```text
client/src/
├── App.tsx                  # Route definitions, ProtectedRoute, AdminRoute, lazy imports
├── components/
│   ├── ErrorBoundary.tsx    # Top-level crash recovery
│   ├── layout/              # AppShell (workspace/auth/minimal), Sidebar, TopNav, MobileNav, CommandPalette (Cmd/Ctrl+K)
│   └── ui/                  # Shared primitives, Charts, ThemeToggle, MotionPrimitives, SmoothScrollProvider
├── context/                 # ThemeContext, ToastContext
├── features/
│   ├── admin/               # Admin Operations Console (/admin)
│   ├── auth/                # AuthContext, Login/Register, OnboardingWizard, Profile
│   ├── dashboard/           # Candidate readiness overview (/dashboard)
│   ├── interview/           # List, Prep, Live Interview, Evaluation + Markdown export (/interviews/*)
│   ├── jobs/                # ATS job explorer & saved jobs (/jobs, /saved-jobs)
│   ├── landing/             # Public landing page (/)
│   ├── matching/            # Match breakdown & skill-gap what-if simulator (/matches/:jobId, /skill-gaps/:jobId)
│   ├── ontology/            # Ontology coverage, audits & admin review queue (/ontology)
│   ├── radar/               # Role-Fit Radar 5-bucket view (/radar)
│   ├── readiness/           # Skill ledger & proof submission (/readiness, /skills)
│   ├── resume/              # File upload, paste, parsed preview & inline section editor (/resume)
│   ├── tailoring/           # Evidence-bounded tailoring workbench (/tailor/:jobId)
│   └── tracker/             # Application pipeline tracker (/applications)
├── lib/                     # api-client.ts, sanitize.ts, chartMath.ts, theme.ts, toast.ts, sentry.ts
└── services/                # authApi.ts
```

### Client Security & Resilience

- **Token lifecycle (`client/src/lib/api-client.ts`):** Injects `Authorization: Bearer <token>`, deduplicates concurrent 401 refresh calls via a shared `refreshPromise`, retries once with the rotated access token, and clears storage + dispatches `truehire:unauthorized` on refresh failure.
- **Untrusted content sanitization (`client/src/lib/sanitize.ts`):** External job HTML is filtered through an allowlist sanitizer before rendering, and external links are validated against `http:`/`https:`.

---

## Closed-Loop Sequence Flow

```mermaid
sequenceDiagram
    actor Candidate
    participant SPA as React SPA
    participant API as Express API
    participant DB as PostgreSQL
    participant AI as AI Provider Router

    Candidate->>SPA: Upload PDF/DOCX or paste resume
    SPA->>API: POST /api/resumes (or /paste)
    API->>AI: Structured resume extraction (Zod validated)
    API->>DB: Save Resume + ResumeParseAudit
    API-->>SPA: Parsed resume, skills & parse quality

    Candidate->>SPA: Inspect Role-Fit Radar / Match Job
    SPA->>API: GET /api/radar · POST /api/matches
    API->>DB: Query active Jobs + UserSkill evidence
    API-->>SPA: Deterministic score, gaps & tactical matrix

    Candidate->>SPA: Create & start targeted interview
    SPA->>API: POST /api/interviews · POST /api/interviews/:id/start
    API->>AI: Generate plan + questions targeting skill gaps
    API->>DB: Save Interview + InterviewQuestions

    loop Each question in sequence
        Candidate->>SPA: Submit answer
        SPA->>API: POST /api/interviews/:id/questions/:qId/answer
        API->>DB: Persist raw answer first (crash-safe)
        API->>AI: Evaluate answer + check adaptive follow-up
        API->>DB: Save JSONB feedback (+ optional follow-up question)
    end

    Candidate->>SPA: Generate final evaluation
    SPA->>API: POST /api/interviews/:id/evaluation
    API->>AI: 5-dimension rubric evaluation
    API->>DB: Transaction: save Evaluation + upsert UserSkill (STRONG/WEAK) + transcript
    API-->>SPA: Report (reflected immediately in /readiness, /matches, /radar)
```

---

## AI Provider Fallback Flow

All AI calls pass through `analyzeResume()` in `server/src/integrations/ai/aiClient.ts`:

```mermaid
flowchart LR
    Req["Service Prompt +\nFeature + Optional Zod Schema"] --> Mock{"AI_E2E_MOCK=true\n& non-prod?"}
    Mock -- "Yes" --> Det["Deterministic E2E Mock\n+ AiRequestAudit"]
    Mock -- "No" --> Chain["Build Provider Chain\nPrimary -> Configured Secondaries\n(groq · nvidia · gemini · ollama)"]
    Chain --> Call["Invoke Active Provider\n(Groq also falls back to GROQ_FAST_MODEL)"]
    Call --> Parse["parseModelJson() +\nZod safeParse()"]
    Parse -- "Valid" --> AuditOK["Record Audit\n(SUCCESS / FALLBACK)"]
    Parse -- "Malformed JSON /\nSchema mismatch" --> Repair["1x Repair Retry\non Same Provider"]
    Repair -- "Valid" --> AuditOK
    Repair -- "Fails" --> Fail["Record FAILURE Audit\n& Sanitize Error"]
    Call -- "HTTP / Timeout /\nRate Limit Error" --> Fail
    Fail --> Next{"Next configured\nprovider?"}
    Next -- "Yes" --> Call
    Next -- "No" --> Err["Throw Sanitized AppError\n(429 / 502 / 503 / 504)"]
```

See [AI Models & Telemetry](./ai-models.md) for provider model tiers, JSON parsing rules, and cost tracking, and [API & Data Model](./api-and-data.md) for endpoint contracts and Prisma models.
