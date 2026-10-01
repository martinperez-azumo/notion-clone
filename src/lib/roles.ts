import type { Role } from "@/db/schema";

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

/** True when `role` is at least as powerful as `minRole`. */
export function hasRole(role: Role | null | undefined, minRole: Role) {
  return role != null && RANK[role] >= RANK[minRole];
}
