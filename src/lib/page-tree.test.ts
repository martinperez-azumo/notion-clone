import { describe, expect, it } from "vitest";

import { buildPageTree, pageLabel, pagePath, type PageRow } from "./page-tree";

const row = (id: string, parentId: string | null = null): PageRow => ({
  id,
  parentId,
  title: id,
  icon: null,
});

describe("buildPageTree", () => {
  it("nests children under their parents, keeping order", () => {
    const tree = buildPageTree([row("a"), row("b"), row("a1", "a"), row("a2", "a")]);
    expect(tree.map((n) => n.id)).toEqual(["a", "b"]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["a1", "a2"]);
  });

  it("drops pages whose parent is missing, with their descendants", () => {
    const tree = buildPageTree([row("a"), row("orphan", "gone"), row("deep", "orphan")]);
    expect(tree.map((n) => n.id)).toEqual(["a"]);
    expect(tree[0].children).toEqual([]);
  });

  it("drops cycles instead of looping", () => {
    expect(buildPageTree([row("x", "y"), row("y", "x")])).toEqual([]);
  });
});

describe("pagePath", () => {
  const rows = [row("a"), row("a1", "a"), row("a1x", "a1"), row("lost", "gone")];

  it("returns root-to-page order", () => {
    expect(pagePath(rows, "a1x").map((p) => p.id)).toEqual(["a", "a1", "a1x"]);
  });

  it("returns [] for unknown or unreachable pages", () => {
    expect(pagePath(rows, "nope")).toEqual([]);
    expect(pagePath(rows, "lost")).toEqual([]);
    expect(pagePath([row("x", "y"), row("y", "x")], "x")).toEqual([]);
  });
});

describe("pageLabel", () => {
  it("falls back to Untitled for blank titles", () => {
    expect(pageLabel({ title: "  " })).toBe("Untitled");
    expect(pageLabel({ title: "Roadmap" })).toBe("Roadmap");
  });
});
