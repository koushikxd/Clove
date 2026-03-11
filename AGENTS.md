AI-powered recruiting platform: recruiters post jobs, AI sources candidates via Exa, sends email invites, conducts async AI interviews, then scores and evaluates them.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Backend/DB**: Convex (queries, mutations, actions, file storage, realtime)
- **Auth**: BetterAuth via `@convex-dev/better-auth` component
- **AI**: Vercel AI SDK + Google Gemini
- **Data fetching**: TanStack React Query + `@convex-dev/react-query`
- **Candidate sourcing**: Exa
- **Email**: Resend
- **Workflows**: Inngest (local dev via Docker Compose)
- **UI**: shadcn/ui + Base UI + Tailwind CSS v4
- **Validation**: Zod

## Commands

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `bun dev`           | Next.js dev server (Turbopack)              |
| `npx convex dev`    | Convex dev server — run alongside `bun dev` |
| `bun build`         | Production build                            |
| `bun lint`          | ESLint                                      |
| `bun format`        | Prettier — formats all ts/tsx               |
| `bun typecheck`     | TypeScript check, no emit                   |
| `docker compose up` | Local Inngest server                        |

## Installing Dependencies

```bash
bun add <package>       # runtime dep
bun add -D <package>    # dev dep
```

## Convex

All backend logic lives in `convex/`. Functions are queries, mutations, or actions. Auth is wired through the `betterAuth` component defined in `convex/convex.config.ts`.

- Schema is in `convex/schema.ts` — update it before adding new tables or fields.
- Tables: `jobs`, `candidates`, `interviews`, `interviewTurns`, `evaluations`.
- HTTP routes are registered in `convex/http.ts` (auth routes only).
- **When adding a new env variable used by Convex backend functions**, remind user to run the following command:
  ```bash
  npx convex env set KEY value
  ```
  `.env.local` values are **not** automatically available to Convex functions.

## Code Style

- No semicolons; double quotes; 2-space indent; trailing commas (ES5).
- Tailwind classes are auto-sorted by Prettier — run `bun format` after touching classNames.
- Use `cn()` from `lib/utils.ts` for conditional class merging; `cva()` for component variants.
- Auth in client components: `authClient` from `lib/auth-client.ts`; server: `lib/auth-server.ts`.
- Path alias `@/` maps to the repo root.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give a list of unresolved questions to answer, if any.
