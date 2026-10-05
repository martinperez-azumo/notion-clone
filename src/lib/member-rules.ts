import type { Role } from "@/db/schema";
import { hasRole } from "@/lib/roles";

/** Roles that can be given through invites and role changes. Each workspace has exactly one owner. */
export const ASSIGNABLE_ROLES = ["admin", "editor", "viewer"] as const satisfies Role[];

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return ASSIGNABLE_ROLES.includes(value as AssignableRole);
}

/**
 * Whether `actor` may change the role of, or remove, a member.
 * Admins and the owner manage everyone except the owner and themselves.
 */
export function canManageMember(
  actor: { userId: string; role: Role },
  target: { userId: string; role: Role },
) {
  return (
    hasRole(actor.role, "admin") &&
    target.role !== "owner" &&
    target.userId !== actor.userId
  );
}
