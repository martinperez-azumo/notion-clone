import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { invites, memberships, users, workspaces } from "@/db/schema";

type Profile = { email: string; name?: string | null; image?: string | null };

/**
 * Runs on every sign-in: upserts the user, turns pending invites into
 * memberships, and gives first-time users a personal workspace.
 * Returns the user's id.
 */
export async function onSignIn(profile: Profile) {
  const email = profile.email.toLowerCase();

  const [user] = await db
    .insert(users)
    .values({ email, name: profile.name, image: profile.image })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: profile.name, image: profile.image },
    })
    .returning({ id: users.id });

  const pending = await db.select().from(invites).where(eq(invites.email, email));
  for (const invite of pending) {
    await db.batch([
      db
        .insert(memberships)
        .values({ workspaceId: invite.workspaceId, userId: user.id, role: invite.role })
        .onConflictDoNothing(),
      db
        .delete(invites)
        .where(and(eq(invites.id, invite.id), eq(invites.email, email))),
    ]);
  }

  const existing = await db
    .select({ workspaceId: memberships.workspaceId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (existing.length === 0) {
    const workspaceId = crypto.randomUUID();
    const firstName = profile.name?.split(" ")[0];
    await db.batch([
      db.insert(workspaces).values({
        id: workspaceId,
        name: firstName ? `${firstName}'s workspace` : "My workspace",
        ownerId: user.id,
      }),
      db.insert(memberships).values({ workspaceId, userId: user.id, role: "owner" }),
    ]);
  }

  return user.id;
}
