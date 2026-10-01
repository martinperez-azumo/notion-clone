import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";

export async function listUserWorkspaces(userId: string) {
  return db
    .select({ id: workspaces.id, name: workspaces.name, role: memberships.role })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(workspaces.createdAt));
}
