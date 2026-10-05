"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { invites, memberships, users } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { isAllowedEmail } from "@/lib/allowed-email";
import { canManageMember, isAssignableRole } from "@/lib/member-rules";
import { isUuid, requireRole } from "@/lib/permissions";

const Email = z.email("Enter a valid email address.");

export async function inviteMember(workspaceId: string, rawEmail: string, role: string) {
  return runAction(async () => {
    const { userId } = await requireRole(workspaceId, "admin");
    const parsed = Email.safeParse(rawEmail.trim().toLowerCase());
    if (!parsed.success) return parsed.error.issues[0].message;
    const email = parsed.data;
    if (!isAllowedEmail(email)) return "Only Azumo Google accounts can be invited.";
    if (!isAssignableRole(role)) return "Pick a role.";

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      // They've signed in before, so add them right away.
      const added = await db
        .insert(memberships)
        .values({ workspaceId, userId: existing.id, role })
        .onConflictDoNothing()
        .returning({ userId: memberships.userId });
      if (added.length === 0) return "That person is already a member.";
    } else {
      // Turned into a membership on their first sign-in (see onboarding.ts).
      await db
        .insert(invites)
        .values({ workspaceId, email, role, invitedBy: userId })
        .onConflictDoUpdate({
          target: [invites.workspaceId, invites.email],
          set: { role, invitedBy: userId },
        });
    }
    refresh();
  });
}

export async function changeMemberRole(workspaceId: string, targetUserId: string, role: string) {
  return runAction(async () => {
    const actor = await requireRole(workspaceId, "admin");
    if (!isAssignableRole(role)) return "Pick a role.";
    const target = await findMember(workspaceId, targetUserId);
    if (!target || !canManageMember(actor, target)) return "You can't change this member's role.";
    await db
      .update(memberships)
      .set({ role })
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, target.userId)));
    refresh();
  });
}

export async function removeMember(workspaceId: string, targetUserId: string) {
  return runAction(async () => {
    const actor = await requireRole(workspaceId, "admin");
    const target = await findMember(workspaceId, targetUserId);
    if (!target || !canManageMember(actor, target)) return "You can't remove this member.";
    await db
      .delete(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, target.userId)));
    refresh();
  });
}

export async function revokeInvite(workspaceId: string, inviteId: string) {
  return runAction(async () => {
    await requireRole(workspaceId, "admin");
    if (!isUuid(inviteId)) return "Invite not found.";
    await db
      .delete(invites)
      .where(and(eq(invites.id, inviteId), eq(invites.workspaceId, workspaceId)));
    refresh();
  });
}

async function findMember(workspaceId: string, userId: string) {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select({ userId: memberships.userId, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId)))
    .limit(1);
  return row ?? null;
}
