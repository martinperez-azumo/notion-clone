# Notion Clone

A Notion-style workspace app for Azumo staff, built for the bench upskilling challenge with Claude Code.

- Google sign-in, limited to `azumo.co` and `azumolabs.com` accounts
- Multiple workspaces with per-workspace roles (owner, admin, editor, viewer)
- Nested pages with a block editor and file attachments (in progress)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS + shadcn/ui · Auth.js v5 · Neon Postgres + Drizzle ORM · BlockNote · Vercel Blob · Vercel hosting

## Local setup

Requires Node.js 20 or newer.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (see below).
3. Create the database tables: `npm run db:migrate`
4. Start the app: `npm run dev`, then open http://localhost:3000

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `AUTH_SECRET` | Run `npx auth secret` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application) |
| `DATABASE_URL` | Neon connection string (set automatically when Neon is added from the Vercel Marketplace) |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated, defaults to `azumo.co,azumolabs.com` |

Google OAuth redirect URIs to register:

- `http://localhost:3000/api/auth/callback/google`
- `https://<production-domain>/api/auth/callback/google`

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:studio` | Browse the database |

## How access control works

- `src/auth.ts` rejects any Google account that isn't verified or isn't on an allowed domain.
- On first sign-in, `src/lib/onboarding.ts` creates the user, accepts pending invites, and creates a personal workspace if the user has none.
- Every page and server action that touches workspace data calls `requireRole(workspaceId, minRole)` from `src/lib/permissions.ts`. Non-members get a 404; members without enough rights get an error.

## Built with Claude Code

Notes on how Claude Code was used, what worked and what didn't, are collected here as the project goes.
