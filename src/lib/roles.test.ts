import { describe, expect, it } from "vitest";

import type { Role } from "@/db/schema";

import { hasRole } from "./roles";

const ROLES: Role[] = ["viewer", "editor", "admin", "owner"];

describe("hasRole", () => {
  it.each(ROLES.flatMap((role, i) => ROLES.map((min, j) => [role, min, i >= j] as const)))(
    "%s meets %s: %s",
    (role, min, expected) => expect(hasRole(role, min)).toBe(expected),
  );

  it("denies a missing membership", () => {
    expect(hasRole(null, "viewer")).toBe(false);
    expect(hasRole(undefined, "viewer")).toBe(false);
  });
});
