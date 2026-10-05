# Notion Clone

A Notion-style workspace app for Azumo staff, built for the bench upskilling challenge with Claude Code.

**Live:** https://notion-clone-ten-olive.vercel.app

- Google sign-in, limited to verified `azumo.co` and `azumolabs.com` accounts
- Multiple workspaces with per-workspace roles: owner, admin, editor, viewer
- Members: invite by email, change roles, remove people, revoke pending invites
- Nested pages with a block editor (BlockNote): headings, lists, to-dos, quotes, code, images and files, with autosave
- File attachments stored privately and served only to members of the page's workspace
- Trash with restore and permanent delete

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS + shadcn/ui (Base UI) · Auth.js v5 · Neon Postgres + Drizzle ORM · BlockNote · Vercel Blob (private) · Vercel hosting

## Local setup

Requires Node.js 20 or newer.

1. Install dependencies: `npm install`
2. Get the environment variables. Either link the Vercel project and pull them (`npx vercel link`, then `npx vercel env pull .env.local`), or copy `.env.example` to `.env.local` and fill it in.
3. Create the database tables: `npm run db:migrate`
4. Optional: sign in once, then add demo content with `npm run db:seed -- you@azumo.co`
5. Start the app: `npm run dev`, then open http://localhost:3000

### Environment variables

| Variable | Where it comes from |
| --- | --- |
| `AUTH_SECRET` | Any long random string, for example `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud Console → Google Auth Platform → Clients → Web application |
| `DATABASE_URL` | Set automatically when Neon is connected from Vercel → Storage |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | Set automatically when a **private** Blob store is connected from Vercel → Storage. New stores use `BLOB_STORE_ID` with Vercel OIDC (`VERCEL_OIDC_TOKEN`, included by `vercel env pull`) |
| `ALLOWED_EMAIL_DOMAINS` | Optional. Comma-separated; defaults to `azumo.co,azumolabs.com` |

Google OAuth redirect URIs to register:

- `http://localhost:3000/api/auth/callback/google`
- `https://notion-clone-ten-olive.vercel.app/api/auth/callback/google`

Preview deployments get a new URL each time, so Google sign-in only works on production and localhost.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Generate route types, then run the TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Create a migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed -- <email>` | Create the "Azumo Delivery Playbook" demo workspace for a user |
| `npm run db:studio` | Browse the database |

Every push to `main` deploys to production on Vercel.

## Project layout

```
src/
  auth.ts                  Auth.js config: Google provider + domain check
  db/schema.ts             Tables: users, workspaces, memberships, invites, pages, attachments
  lib/permissions.ts       requireRole / requirePageRole / findPageAccess
  lib/onboarding.ts        First sign-in: user row, pending invites, personal workspace
  app/actions/             Server actions: workspaces, members, pages
  app/api/files/           Upload tokens (POST /upload) and permission-checked downloads (GET /[id])
  app/w/[workspaceId]/     Workspace layout (sidebar), home, page view, settings, trash
  components/editor/       BlockNote editor (client-only), autosave, uploads
scripts/seed-demo.mts      Demo content
```

## How access control works

| Action | Owner | Admin | Editor | Viewer |
| --- | :-: | :-: | :-: | :-: |
| View pages and files | ✓ | ✓ | ✓ | ✓ |
| Create, edit, trash and delete pages; upload files | ✓ | ✓ | ✓ | |
| Invite people, change roles, remove members | ✓ | ✓ | | |
| Rename or delete the workspace | ✓ | | | |

- `src/auth.ts` rejects any Google account that isn't verified or isn't on an allowed domain. The check is exact: `azumo.com`, `azumo.co.uk` and subdomains are rejected.
- Every page render and every server action calls `requireRole` (or `requirePageRole` for actions that only get a page id) from `src/lib/permissions.ts`. Non-members get a 404, so workspace and page ids reveal nothing; members without enough rights get an error. Hiding buttons in the UI is only a convenience.
- Nobody can change the owner's role or their own. Each workspace has exactly one owner.
- Invites are limited to allowed domains. People who already signed in are added immediately; others become members on their first sign-in.

### Files

1. The editor asks `POST /api/files/upload` for a presigned upload URL. The route checks that the user is an editor of the page, then signs a token for that one pathname inside the page's folder (`pages/<pageId>/`), limited to an allowlist of file types (no HTML or SVG) and 25 MB, valid for 10 minutes.
2. The browser uploads straight to the **private** Blob store, so large files never pass through a serverless function.
3. The `recordAttachment` server action confirms the file is in our store under that page's folder and saves it to `attachments`.
4. The editor embeds `/api/files/<attachmentId>`. That route checks workspace membership on every request and streams the file, inline for images, PDFs and media and as a download for everything else.
5. Permanently deleting a page (with its subpages) or a workspace also deletes its files from Blob.

## Demo script (about 5 minutes)

1. **Sign in** with an Azumo Google account. Try a personal Gmail account first to show it's rejected.
2. **Workspaces:** open the switcher at the top left, show your role in each workspace, and create a new one.
3. **Pages:** in "Azumo Delivery Playbook", expand the nested pages. Create a page, give it an icon and a title, and type with the `/` menu. Reload the page to show it autosaved.
4. **Files:** drag an image and a PDF into the page, then click the PDF to open it.
5. **Members:** in Settings & members, invite a teammate as a viewer and change a role.
6. **Viewer:** in a second browser signed in as the viewer, show the page is read-only and the edit controls are gone.
7. **Trash:** move a page with subpages to the trash, then restore it.

## Built with Claude Code

What worked:

- **PRD first, in plan mode.** The requirements, permission matrix and data model were written before any code, and the code follows them closely.
- **Reading the bundled Next.js 16 docs before writing code.** Several APIs differ from older versions and from the model's training data: `refresh()` from `next/cache` after mutations, `retry` (not `reset`) in `error.tsx`, and the `PageProps`/`LayoutProps`/`RouteContext` route type helpers that need `next typegen`.
- **Unit tests for the rules that matter:** the email domain check, role ranking, member-management rules, page tree building and file name and type checks.
- **Guided setup of Vercel, Neon and Google OAuth.** This was the first time using Vercel; pasting dashboard screens into the chat worked well.

What to watch out for:

- **Type checks and unit tests didn't catch a UI crash.** A Base UI dropdown label must sit inside a group, and the menu crashed only when opened in the browser. Clicking through every screen after each deploy is still needed. Component or end-to-end tests (for example Playwright) would catch this.
- **Secrets:** don't paste secrets or screenshots of them into the chat. One CLI login with `--debug` printed a token into the session log, so it was revoked with `vercel logout`. Claude Code's safety checks also blocked it from writing secrets into Vercel, so the user added those.
- **Requirements from auto-generated meeting notes can be wrong.** The notes said `azumo.com`, but the real domain is `azumo.co`.
- **Local tooling:** an old Node 14 install managed by nvm came first in PATH, ahead of Node 22, and needed a workaround.
