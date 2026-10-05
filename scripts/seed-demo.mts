/**
 * Creates a demo workspace with nested, filled-in pages for the given user.
 *
 *   npm run db:seed -- you@azumo.co
 *
 * The user must have signed in once. Safe to re-run: it skips if the user
 * already owns a workspace with the demo name.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema.ts";

config({ path: ".env.local" });

const WORKSPACE_NAME = "Azumo Delivery Playbook";

type Block = Record<string, unknown>;
type SeedPage = { title: string; icon: string; content: Block[]; children?: SeedPage[] };

const h = (level: 1 | 2 | 3, text: string): Block => ({ type: "heading", props: { level }, content: text });
const p = (text: string): Block => ({ type: "paragraph", content: text });
const li = (text: string): Block => ({ type: "bulletListItem", content: text });
const num = (text: string): Block => ({ type: "numberedListItem", content: text });
const todo = (text: string, checked = false): Block => ({ type: "checkListItem", props: { checked }, content: text });
const quote = (text: string): Block => ({ type: "quote", content: text });

const PAGES: SeedPage[] = [
  {
    title: "Welcome",
    icon: "🚀",
    content: [
      p("This workspace collects how Azumo teams plan, build and hand over client work. Start with the pages in the sidebar, or add your own."),
      h(2, "Getting started"),
      todo("Read How we work", true),
      todo("Check the sprint rituals"),
      todo("Add yourself to a client project page"),
      quote("Tip: type / anywhere to insert headings, lists, images or files."),
    ],
    children: [
      {
        title: "How we work",
        icon: "🧭",
        content: [
          h(2, "Principles"),
          li("Ship small, demo often: every sprint ends with something a client can click."),
          li("Write it down: decisions live in pages like this one, not in chat threads."),
          li("Own the outcome: the pod owns delivery end to end, from PRD to production."),
          h(2, "Roles in a pod"),
          li("Technical project manager: scope, schedule and client communication."),
          li("Engineers: design, build, test and deploy."),
          li("Designer (part-time): UX flows and UI review."),
        ],
      },
      {
        title: "Sprint rituals",
        icon: "📅",
        content: [
          h(2, "Every two weeks"),
          num("Planning (Monday, 1 hour): pick goals, size the work."),
          num("Daily stand-up (15 minutes): blockers first."),
          num("Demo (Friday, 30 minutes): show working software to the client."),
          num("Retro (Friday, 30 minutes): one thing to keep, one to change."),
        ],
      },
    ],
  },
  {
    title: "Clients & Projects",
    icon: "📊",
    content: [
      p("One page per active engagement. Keep status, contacts and links up to date."),
      h(2, "Status key"),
      li("🟢 On track"),
      li("🟡 At risk: flagged in the weekly report"),
      li("🔴 Blocked: escalate to the TPM"),
    ],
    children: [
      {
        title: "Acme Corp: Mobile app",
        icon: "📱",
        content: [
          h(2, "Status: 🟢 On track"),
          p("React Native app for field technicians. Sprint 6 of 10."),
          h(3, "This sprint"),
          todo("Offline sync for work orders", true),
          todo("Photo capture with annotations"),
          todo("Release candidate to TestFlight"),
        ],
      },
      {
        title: "Globex: Data platform",
        icon: "🗂️",
        content: [
          h(2, "Status: 🟡 At risk"),
          p("Migrating nightly ETL to streaming. Waiting on the client's network change for the Kafka cluster."),
          h(3, "Next steps"),
          li("Confirm firewall change date with the Globex infra team."),
          li("Run the backfill in staging with last month's data."),
        ],
      },
    ],
  },
  {
    title: "Design guidelines",
    icon: "🎨",
    content: [
      p("We build on shadcn/ui and Tailwind. Reuse components before creating new ones."),
      h(2, "Checklist for every screen"),
      todo("Empty, loading and error states designed"),
      todo("Works at 375 px wide"),
      todo("Keyboard reachable, visible focus"),
      todo("Text contrast at least 4.5:1"),
    ],
  },
];

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run db:seed -- you@azumo.co");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (.env.local).");

  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!user) throw new Error(`No user ${email}. Sign in to the app once, then re-run.`);

  const [existing] = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(and(eq(schema.workspaces.ownerId, user.id), eq(schema.workspaces.name, WORKSPACE_NAME)));
  if (existing) {
    console.log(`"${WORKSPACE_NAME}" already exists for ${email}: /w/${existing.id}`);
    return;
  }

  const workspaceId = crypto.randomUUID();
  const rows: (typeof schema.pages.$inferInsert)[] = [];
  const addPages = (list: SeedPage[], parentId: string | null) =>
    list.forEach((page, position) => {
      const id = crypto.randomUUID();
      rows.push({
        id,
        workspaceId,
        parentId,
        title: page.title,
        icon: page.icon,
        content: page.content,
        position,
        createdBy: user.id,
      });
      addPages(page.children ?? [], id);
    });
  addPages(PAGES, null);

  await db.batch([
    db.insert(schema.workspaces).values({ id: workspaceId, name: WORKSPACE_NAME, ownerId: user.id }),
    db.insert(schema.memberships).values({ workspaceId, userId: user.id, role: "owner" }),
    db.insert(schema.pages).values(rows),
  ]);
  console.log(`Created "${WORKSPACE_NAME}" with ${rows.length} pages: /w/${workspaceId}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
