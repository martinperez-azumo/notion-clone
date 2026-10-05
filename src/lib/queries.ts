import "server-only";

import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { invites, memberships, pages, users, workspaces } from "@/db/schema";

export const listUserWorkspaces = cache(async (userId: string) => {
  return db
    .select({ id: workspaces.id, name: workspaces.name, role: memberships.role })
    .from(memberships)
    .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(workspaces.createdAt));
});

/** Live (not archived) pages, sorted the way the sidebar shows them. */
export const listPages = cache(async (workspaceId: string) => {
  return db
    .select({
      id: pages.id,
      parentId: pages.parentId,
      title: pages.title,
      icon: pages.icon,
    })
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), isNull(pages.archivedAt)))
    .orderBy(asc(pages.position), asc(pages.createdAt));
});

export async function listArchivedPages(workspaceId: string) {
  return db
    .select({
      id: pages.id,
      title: pages.title,
      icon: pages.icon,
      archivedAt: pages.archivedAt,
    })
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), isNotNull(pages.archivedAt)))
    .orderBy(desc(pages.archivedAt));
}

/** A page, only if it belongs to `workspaceId`. */
export async function getPage(workspaceId: string, pageId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)))
    .limit(1);
  return page ?? null;
}

export async function listMembers(workspaceId: string) {
  return db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.workspaceId, workspaceId))
    .orderBy(asc(memberships.createdAt));
}

export async function listInvites(workspaceId: string) {
  return db
    .select({ id: invites.id, email: invites.email, role: invites.role })
    .from(invites)
    .where(eq(invites.workspaceId, workspaceId))
    .orderBy(asc(invites.createdAt));
}
