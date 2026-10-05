"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { pages } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { isUuid, requirePageRole, requireRole } from "@/lib/permissions";

const Title = z.string().max(200, "Use 200 characters or fewer.");
const Icon = z.string().trim().min(1).max(16).nullable();
// BlockNote documents are arrays of block objects. The byte cap keeps a
// single save well under the 1 MB server action body limit.
const Content = z.array(z.record(z.string(), z.unknown())).max(5000);
const MAX_CONTENT_BYTES = 800_000;

const ARCHIVED = "This page is in the trash. Restore it to edit.";

export async function createPage(workspaceId: string, parentId: string | null = null) {
  let created: string | undefined;
  const result = await runAction(async () => {
    const { userId } = await requireRole(workspaceId, "editor");
    if (parentId !== null) {
      const [parent] = isUuid(parentId)
        ? await db
            .select({ id: pages.id })
            .from(pages)
            .where(
              and(
                eq(pages.id, parentId),
                eq(pages.workspaceId, workspaceId),
                isNull(pages.archivedAt),
              ),
            )
            .limit(1)
        : [];
      if (!parent) return "The parent page no longer exists.";
    }

    const siblings = parentId === null ? isNull(pages.parentId) : eq(pages.parentId, parentId);
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${pages.position}), -1) + 1` })
      .from(pages)
      .where(and(eq(pages.workspaceId, workspaceId), siblings));

    const [page] = await db
      .insert(pages)
      .values({ workspaceId, parentId, createdBy: userId, position: Number(next) })
      .returning({ id: pages.id });
    created = page.id;
  });
  if (result.error || !created) return result;
  redirect(`/w/${workspaceId}/p/${created}`);
}

export async function updatePageTitle(pageId: string, title: string) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    if (page.archivedAt) return ARCHIVED;
    const parsed = Title.safeParse(title);
    if (!parsed.success) return parsed.error.issues[0].message;
    await db
      .update(pages)
      .set({ title: parsed.data, updatedAt: new Date() })
      .where(eq(pages.id, page.id));
    refresh();
  });
}

export async function updatePageIcon(pageId: string, icon: string | null) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    if (page.archivedAt) return ARCHIVED;
    const parsed = Icon.safeParse(icon);
    if (!parsed.success) return "That icon isn't valid.";
    await db
      .update(pages)
      .set({ icon: parsed.data, updatedAt: new Date() })
      .where(eq(pages.id, page.id));
    refresh();
  });
}

/** Autosave target for the editor. Doesn't refresh: the editor already shows the content. */
export async function savePageContent(pageId: string, content: unknown) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    if (page.archivedAt) return ARCHIVED;
    const parsed = Content.safeParse(content);
    if (!parsed.success) return "The page content couldn't be saved.";
    if (JSON.stringify(parsed.data).length > MAX_CONTENT_BYTES) {
      return "This page is too large to save. Split it into subpages.";
    }
    await db
      .update(pages)
      .set({ content: parsed.data, updatedAt: new Date() })
      .where(eq(pages.id, page.id));
  });
}

/** Moves a page to the trash. Its subpages are hidden with it. */
export async function archivePage(pageId: string) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    await db.update(pages).set({ archivedAt: new Date() }).where(eq(pages.id, page.id));
    refresh();
  });
}

export async function restorePage(pageId: string) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    // If the parent is gone or still in the trash, restore to the top level.
    const [parent] = page.parentId
      ? await db
          .select({ id: pages.id })
          .from(pages)
          .where(and(eq(pages.id, page.parentId), isNull(pages.archivedAt)))
          .limit(1)
      : [];
    await db
      .update(pages)
      .set({ archivedAt: null, parentId: parent ? page.parentId : null })
      .where(eq(pages.id, page.id));
    refresh();
  });
}

/** Permanently deletes a trashed page and, through the foreign key, its subpages. */
export async function deletePage(pageId: string) {
  return runAction(async () => {
    const { page } = await requirePageRole(pageId, "editor");
    if (!page.archivedAt) return "Move the page to the trash first.";
    await db.delete(pages).where(eq(pages.id, page.id));
    refresh();
  });
}
