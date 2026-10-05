"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { type ActionResult, runAction } from "@/lib/action-result";
import { attachmentUrlsForWorkspace, deleteBlobs } from "@/lib/blob-cleanup";
import { requireRole, requireUser } from "@/lib/permissions";

const Name = z.string().trim().min(1, "Give the workspace a name.").max(80, "Use 80 characters or fewer.");

export async function createWorkspace(name: string): Promise<ActionResult> {
  const { userId } = await requireUser();
  const parsed = Name.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const workspaceId = crypto.randomUUID();
  await db.batch([
    db.insert(workspaces).values({ id: workspaceId, name: parsed.data, ownerId: userId }),
    db.insert(memberships).values({ workspaceId, userId, role: "owner" }),
  ]);
  redirect(`/w/${workspaceId}`);
}

export async function renameWorkspace(workspaceId: string, name: string) {
  return runAction(async () => {
    await requireRole(workspaceId, "owner");
    const parsed = Name.safeParse(name);
    if (!parsed.success) return parsed.error.issues[0].message;
    await db.update(workspaces).set({ name: parsed.data }).where(eq(workspaces.id, workspaceId));
    refresh();
  });
}

export async function deleteWorkspace(workspaceId: string) {
  const result = await runAction(async () => {
    await requireRole(workspaceId, "owner");
    const files = await attachmentUrlsForWorkspace(workspaceId);
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    after(() => deleteBlobs(files));
  });
  if (result.error) return result;
  redirect("/");
}

export async function leaveWorkspace(workspaceId: string) {
  const result = await runAction(async () => {
    const { userId, role } = await requireRole(workspaceId, "viewer");
    if (role === "owner") return "The owner can't leave. Delete the workspace instead.";
    await db
      .delete(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)));
  });
  if (result.error) return result;
  redirect("/");
}
