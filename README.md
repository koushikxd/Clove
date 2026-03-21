# Clove

Clove is an AI recruiting app for sourcing candidates, running async AI interviews, and reviewing shortlisted applicants.

## Roles

- Recruiter: creates jobs, reviews sourced candidates, and evaluates shortlisted candidates
- Candidate: accepts an invite, uploads a resume, and completes the interview

## Overview

Clove keeps the core business flow deterministic and uses AI where judgment is useful.

### Workflow

1. A recruiter creates a job.
2. Inngest starts the sourcing workflow.
3. AI generates search criteria, and Exa finds candidate matches.
4. One demo invite email is sent to `EMAIL_ADDRESS`.
5. The candidate accepts the invite with the invited email, signs in, and uploads a resume.
6. The AI interview worker runs the interview turn by turn through Convex actions.
7. The evaluation worker scores the full transcript.
8. The recruiter reviews shortlisted candidates, scores, summaries, and transcripts in the dashboard.

## Stack

- Next.js 16
- React 19
- Convex
- Better Auth
- Inngest
- Vercel AI SDK with Gemini
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

### 2. Create the env file

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

```bash
# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CONVEX_SITE_URL=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_ADDRESS=

# Candidate sourcing
EXA_API_KEY=

# Inngest
INNGEST_DEVSERVER_URL=http://127.0.0.1:8288
INNGEST_BASE_URL=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Internal workflow bridge
WORKFLOW_SECRET=
```

Generate secrets with:

```bash
openssl rand -base64 32
```

### 3. Start the app

Use three terminals:

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

### 4. Set Convex environment variables

Environment variables used inside Convex functions must also be set in Convex:

```bash
bunx convex env set GOOGLE_GENERATIVE_AI_API_KEY <your-key>
bunx convex env set RESEND_API_KEY <your-key>
bunx convex env set EXA_API_KEY <your-key>
bunx convex env set WORKFLOW_SECRET <your-secret>
```

`.env.local` is not automatically available to Convex functions.

## Useful Commands

- `bun dev` - start the Next.js app
- `bun build` - create a production build
- `bun lint` - run ESLint
- `bun typecheck` - run TypeScript checks
- `bun format` - format TypeScript and TSX files
- `docker compose up -d` - start local services
- `bunx convex dev` - start the Convex dev server

## Notes

- Interview transcripts are stored as ordered turns rather than a single raw blob.
- Evaluation results are stored separately from interview turns.
- The demo sourcing flow currently uses Exa Search, not Exa Websets.
- Only one demo invite is sent to `EMAIL_ADDRESS`; sourced candidates still appear in the UI for review.
- Recruiter email follow-up is intentionally skipped in the demo flow.
