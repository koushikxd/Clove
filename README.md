# Clove

Automated recruiting platform. Candidate sourcing, outreach, AI-powered interviews, evaluation, and shortlisting -- end to end.

Two roles: **Recruiter** (posts jobs, reviews results) and **Candidate** (receives invite, uploads resume, completes AI interview).

> See [SETUP.md](./SETUP.md) for local dev setup, env keys, and running instructions.

## How it works

```
Recruiter posts job
       |
       v
  Inngest sourcing workflow
       |
       v
  AI generates search criteria --> Exa websets finds candidates
       |
       v
  Candidates normalized + ranked --> Invite emails sent (Resend)
       |
       v
  Candidate clicks invite link --> Logs in --> Uploads resume (Convex storage)
       |
       v
  Inngest resumes follow-up workflow
       |
       v
  AI interview (browser mic/TTS, server-side session)
       |
       v
  AI evaluates interview --> Scores + recommendation
       |
       v
  Shortlisted candidates --> Recruiter notified (email + in-app)
```

## Flow detail

### A. Candidate sourcing

1. Recruiter posts job in app
2. Convex stores job, emits event to Inngest
3. Inngest workflow: AI generates search criteria -> Exa websets search -> results normalized + ranked
4. Invite emails sent via Resend (from: `onboarding@resend.dev`)
5. Workflow pauses (`step.waitForEvent`) until candidate accepts

### B. Acceptance + resume upload

- Email contains signed interview link with invite token
- Candidate clicks link -> redirected to login -> uploads resume (stored in Convex file storage)
- App validates token, updates candidate status to `accepted`
- App emits `candidate.accepted` event -> Inngest resumes follow-up workflow

### C. Live interview

- Browser: `SpeechRecognition` (mic input) + `SpeechSynthesis` (TTS output)
- Backend: stores utterances + interview state per session
- AI interview worker generates next question via Gemini (AI SDK)
- Partial transcripts stored temporarily, finalized per turn

### D. Transcript handling

Stored as **turns**, not raw blobs:

- Each AI question = one turn (`role: "ai"`)
- Each candidate answer = one turn (`role: "candidate"`)
- Partial transcripts are temporary (`isPartial: true`)
- Final transcript committed at end of turn
- Complete interview transcript assembled from ordered turns

### E. Evaluation + shortlisting

- AI evaluates full transcript: technical skills, communication, problem solving, culture fit
- Generates recommendation: `shortlist` / `reject` / `maybe`
- Shortlisted candidates surfaced to recruiter with scores, summary, and full transcript

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router)                                    │
│  ├── app/           UI pages + API routes                   │
│  ├── lib/           Auth clients, shared utilities          │
│  └── inngest/       Workflow client + function definitions  │
├─────────────────────────────────────────────────────────────┤
│  Convex             Database, file storage, auth (backend)  │
│  ├── schema.ts      Application tables                     │
│  └── better-auth/   Auth component (BetterAuth adapter)    │
├─────────────────────────────────────────────────────────────┤
│  Inngest            Workflow orchestration (docker)         │
│  AI SDK + Gemini    AI workers (sourcing, interview, eval)  │
│  Resend             Email delivery                          │
│  Exa Websets        Candidate sourcing                      │
└─────────────────────────────────────────────────────────────┘
```

### Workflows vs AI workers

Business process logic lives in **Inngest workflows** (deterministic, ordered steps). AI handles only the **fuzzy parts** via 3 focused workers:

| Worker                | When                        | Responsibilities                                                                                                |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Sourcing worker**   | After recruiter posts a job | Turn job description into search criteria, call Exa, score candidate fit, decide whether to invite              |
| **Interview worker**  | During live interview       | Ask next question, adapt based on previous answer, maintain interview state, end when enough evidence collected |
| **Evaluation worker** | After interview ends        | Analyze full transcript, produce scores + fit summary + shortlist recommendation                                |

The workflow code controls the process (sourcing -> outreach -> interview -> evaluation -> shortlist). The AI workers are called within workflow steps only when a fuzzy decision is needed. This keeps the system predictable and debuggable.

## Tech stack

| Layer              | Tech                                              |
| ------------------ | ------------------------------------------------- |
| Framework          | Next.js 16, React 19, TypeScript                  |
| Database + backend | Convex (schema, queries, mutations, file storage) |
| Auth               | BetterAuth + Convex adapter (email/password)      |
| Workflows          | Inngest (event-driven step functions)             |
| AI                 | Vercel AI SDK + Google Gemini                     |
| Email              | Resend                                            |
| Sourcing           | Exa Websets                                       |
| UI                 | shadcn/ui (base-nova), Tailwind v4                |
| Package manager    | Bun                                               |

## Database schema

Defined in `convex/schema.ts`. Auth tables live in `convex/better-auth/schema.ts` (separate component).

| Table            | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `jobs`           | Recruiter job postings (title, requirements, status, recruiterId)   |
| `candidates`     | Sourced candidates per job (status lifecycle, resume, invite token) |
| `interviews`     | Interview sessions (status, scores)                                 |
| `interviewTurns` | Individual Q&A turns within an interview                            |
| `evaluations`    | AI evaluation results (scores, summary, recommendation)             |

## Project structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts    # BetterAuth catch-all
│   │   └── inngest/route.ts          # Inngest serve endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── convex-client-provider.tsx
│   ├── theme-provider.tsx
│   └── ui/                           # shadcn components
├── convex/
│   ├── schema.ts                     # App tables (jobs, candidates, etc.)
│   ├── better-auth/                  # Auth component
│   ├── http.ts                       # HTTP router
│   └── convex.config.ts
├── inngest/
│   └── client.ts                     # Inngest client instance
├── lib/
│   ├── auth-client.ts
│   ├── auth-server.ts
│   └── utils.ts
├── docker-compose.yml                # Inngest dev server
├── .env.example
└── SETUP.md                          # Full setup instructions
```

## TODO

### Infrastructure

- [ ] Add role-based auth (recruiter vs candidate roles on user)
- [ ] Add middleware.ts for route protection
- [ ] Set up Convex environment variables for API keys (Resend, Exa, Gemini)

### Convex backend

- [ ] Job CRUD mutations + queries (create, list, get, update status)
- [ ] Candidate mutations (create, update status, bulk insert from sourcing)
- [ ] Interview mutations (create session, update status, increment turns)
- [ ] Interview turn mutations (add turn, finalize turn, get transcript)
- [ ] Evaluation mutations (create evaluation, get by job)
- [ ] File upload HTTP action for resumes
- [ ] Convex action to emit Inngest events (via fetch to Inngest API or Next.js API)

### Inngest workflows

- [ ] Sourcing workflow: `job.created` -> sourcing worker -> normalize -> invite emails -> `step.waitForEvent`
- [ ] Follow-up workflow: `candidate.accepted` -> create interview -> notify candidate
- [ ] Evaluation workflow: `interview.completed` -> evaluation worker -> score -> update candidate status -> notify recruiter

### AI workers (Gemini via AI SDK)

- [ ] **Sourcing worker** -- takes job description, outputs search criteria (structured output), scores candidate fit, returns invite/skip decision
- [ ] **Interview worker** -- takes job context + resume + previous turns, outputs next question text, decides when to end interview
- [ ] **Evaluation worker** -- takes full transcript + job requirements, outputs scores (technical, communication, problem-solving, culture fit) + summary + recommendation

> Workers are called within Inngest workflow steps. They handle the fuzzy AI decisions. The workflow handles the deterministic process (ordering, retries, state transitions, email sending).

### Email (Resend)

- [ ] Invite email template (with signed interview link)
- [ ] Shortlist notification email to recruiter
- [ ] Interview reminder email

### Interview UI

- [ ] Interview page with SpeechRecognition (mic input)
- [ ] SpeechSynthesis for AI questions (TTS output)
- [ ] Real-time transcript display
- [ ] Interview progress indicator

### Recruiter UI

- [ ] Job creation form
- [ ] Job listing / dashboard
- [ ] Candidate list per job (with status filters)
- [ ] Interview transcript viewer
- [ ] Evaluation results + scores display

### Candidate UI

- [ ] Invite acceptance + login flow
- [ ] Resume upload page
- [ ] Interview interface
- [ ] Interview completion confirmation
