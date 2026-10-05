import { describe, expect, it } from "vitest";

import { canManageMember, isAssignableRole } from "./member-rules";

describe("canManageMember", () => {
  const owner = { userId: "o", role: "owner" as const };
  const admin = { userId: "a", role: "admin" as const };
  const editor = { userId: "e", role: "editor" as const };
  const viewer = { userId: "v", role: "viewer" as const };

  it("lets owners and admins manage editors, viewers and other admins", () => {
    expect(canManageMember(owner, admin)).toBe(true);
    expect(canManageMember(owner, viewer)).toBe(true);
    expect(canManageMember(admin, editor)).toBe(true);
    expect(canManageMember(admin, { userId: "a2", role: "admin" })).toBe(true);
  });

  it("never allows touching the owner or yourself", () => {
    expect(canManageMember(admin, owner)).toBe(false);
    expect(canManageMember(owner, owner)).toBe(false);
    expect(canManageMember(admin, admin)).toBe(false);
  });

  it("denies editors and viewers", () => {
    expect(canManageMember(editor, viewer)).toBe(false);
    expect(canManageMember(viewer, viewer)).toBe(false);
  });
});

describe("isAssignableRole", () => {
  it("accepts admin, editor and viewer only", () => {
    expect(["admin", "editor", "viewer"].every(isAssignableRole)).toBe(true);
    expect(isAssignableRole("owner")).toBe(false);
    expect(isAssignableRole("superuser")).toBe(false);
    expect(isAssignableRole(undefined)).toBe(false);
  });
});
