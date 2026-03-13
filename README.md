# Clove

AI recruiting app for sourcing candidates, running async AI interviews, and reviewing shortlisted candidates.

Two roles:
- Recruiter: creates jobs, reviews sourced candidates, reviews shortlisted candidates
- Candidate: accepts invite, uploads resume, completes interview

## What It Does

Clove keeps the business process in workflows and uses AI only for the fuzzy parts.

Flow:
1. Recruiter creates a job
2. Inngest runs the sourcing workflow
3. AI generates search criteria and Exa finds candidates
4. Demo invite email is sent
5. Candidate accepts invite, signs in, uploads resume
6. AI interview worker runs the interview turn by turn
7. Evaluation worker scores the full transcript
8. Recruiter sees shortlisted candidates, scores, summaries, and transcripts in the dashboard

## Stack

- Next.js 16
- React 19
- Convex
- BetterAuth
- Inngest
- Vercel AI SDK + Gemini
- Exa
- Resend
- Tailwind CSS v4
- shadcn/ui
- Bun

## Core Tables

- `jobs`
- `candidates`
- `jobInvites`
- `interviews`
- `interviewTurns`
- `evaluations`
- `users`
- `recruiterProfiles`
- `candidateProfiles`

## Local Setup

### Prerequisites

- Bun
- Docker
- Convex account

### 1. Install dependencies

```bash
bun install
```

### 2. Create env file

```bash
cp .env.example .env.local
```

Fill in these keys in `.env.local`:

```bash
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

GOOGLE_GENERATIVE_AI_API_KEY=
RESEND_API_KEY=
EMAIL_ADDRESS=
EXA_API_KEY=

INNGEST_DEVSERVER_URL=http://127.0.0.1:8288
INNGEST_BASE_URL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

WORKFLOW_SECRET=
```

Generate secrets:

```bash
openssl rand -base64 32
```

### 3. Start the app

Use 3 terminals.

Terminal 1:

```bash
docker compose up -d
```

Terminal 2:

```bash
bunx convex dev
```

Terminal 3:

```bash
bun dev
```

App URLs:

- App: `http://localhost:3000`
- Inngest: `http://localhost:8288`

### 4. Set Convex env vars

Values used by Convex functions must also be set in Convex:

```bash
bunx convex env set GOOGLE_GENERATIVE_AI_API_KEY <your-key>
bunx convex env set RESEND_API_KEY <your-key>
bunx convex env set EXA_API_KEY <your-key>
bunx convex env set WORKFLOW_SECRET <your-secret>
```

`.env.local` is not automatically available inside Convex functions.

## Useful Commands

```bash
bun dev
bun build
bun lint
bun typecheck
bun format
docker compose up -d
bunx convex dev
```

## Notes

- Interview transcripts are stored as ordered turns, not one raw blob.
- Evaluation results are stored separately from interview turns.
- Recruiter email follow-up is intentionally skipped for the demo flow.

For more setup detail, see [SETUP.md](./SETUP.md).
