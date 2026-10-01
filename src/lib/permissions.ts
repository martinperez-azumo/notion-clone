import "server-only";

import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, type Role } from "@/db/schema";
import { hasRole } from "@/lib/roles";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ForbiddenError extends Error {
  constructor() {
    super("You don't have permission to do that.");
  }
}

/** The signed-in user's id, or a redirect to /login. */
export const requireUser = cache(async () => {
  const user = (await auth())?.user;
  if (!user?.id) redirect("/login");
  return { userId: user.id, user };
});

export const getMembership = cache(async (workspaceId: string, userId: string) => {
  const [row] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)))
    .limit(1);
  return row ?? null;
});

/**
 * Gate for every read and write on workspace data.
 * Non-members get a 404 so the workspace's existence isn't revealed;
 * members below `minRole` get a ForbiddenError.
 */
export async function requireRole(workspaceId: string, minRole: Role) {
  const { userId } = await requireUser();
  if (!UUID.test(workspaceId)) notFound();
  const membership = await getMembership(workspaceId, userId);
  if (!membership) notFound();
  if (!hasRole(membership.role, minRole)) throw new ForbiddenError();
  return { userId, role: membership.role };
}
