# Setup

## Prerequisites

- [Bun](https://bun.sh/) (package manager + runtime)
- [Docker](https://www.docker.com/) (for Inngest dev server)
- [Convex](https://www.convex.dev/) account (free tier works)

## 1. Install dependencies

```bash
bun install
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the following keys in `.env.local`:

### Convex

| Variable                      | Where to get it                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`           | Run `bunx convex dev` -- it creates a deployment and prints this                |
| `NEXT_PUBLIC_CONVEX_URL`      | Convex dashboard > Settings > Deployment URL (e.g. `https://xxx.convex.cloud`)  |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex dashboard > Settings > HTTP Actions URL (e.g. `https://xxx.convex.site`) |

### Auth (BetterAuth)

| Variable               | Where to get it                       |
| ---------------------- | ------------------------------------- |
| `BETTER_AUTH_SECRET`   | Generate: `openssl rand -base64 32`   |
| `BETTER_AUTH_URL`      | `http://localhost:3000` for local dev |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local dev |

### AI (Gemini)

| Variable                       | Where to get it                                                         |
| ------------------------------ | ----------------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) > Create API key |

### Email (Resend)

| Variable         | Where to get it                                                  |
| ---------------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY` | [Resend dashboard](https://resend.com/api-keys) > Create API key |

### Candidate sourcing (Exa)

| Variable      | Where to get it                                                     |
| ------------- | ------------------------------------------------------------------- |
| `EXA_API_KEY` | [Exa dashboard](https://dashboard.exa.ai/api-keys) > Create API key |

### Inngest

Not needed for local dev (the Docker container handles it). For production:

| Variable              | Where to get it                                                    |
| --------------------- | ------------------------------------------------------------------ |
| `INNGEST_EVENT_KEY`   | [Inngest dashboard](https://app.inngest.com/) > Environment > Keys |
| `INNGEST_SIGNING_KEY` | Inngest dashboard > Environment > Signing Key                      |

## 3. Start services

You need **3 terminals**:

**Terminal 1 -- Inngest dev server:**

```bash
docker compose up -d
# Dashboard: http://localhost:8288
```

**Terminal 2 -- Convex backend:**

```bash
bunx convex dev
```

On first run, Convex will prompt you to create a project. Follow the prompts. It will populate `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` in `.env.local` automatically.

**Terminal 3 -- Next.js app:**

```bash
bun dev
# App: http://localhost:3000
```

## 4. Verify setup

- App loads at `http://localhost:3000`
- Inngest dashboard at `http://localhost:8288` shows your app connected
- Convex dashboard shows your schema tables (jobs, candidates, interviews, etc.)

## Convex environment variables

API keys used by Convex server-side actions (Resend, Exa, Gemini) must also be set in the Convex dashboard:

```bash
bunx convex env set GOOGLE_GENERATIVE_AI_API_KEY <your-key>
bunx convex env set RESEND_API_KEY <your-key>
bunx convex env set EXA_API_KEY <your-key>
```

## Troubleshooting

**Inngest can't connect to the app:** Make sure Docker is running and the app is on port 3000. The docker compose uses `host.docker.internal` to reach your local machine.

**Convex schema errors:** Run `bunx convex dev` -- it will push schema changes and show any validation errors.

**Missing env vars:** Check `.env.example` for the full list. Convex-specific vars go in `.env.local`, auth secrets in `.env`.
