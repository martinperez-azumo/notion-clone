export type PageRow = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
};

export type PageNode = PageRow & { children: PageNode[] };

/**
 * Nests a flat, already-sorted list of live pages. Pages whose parent is not
 * in the list (archived or deleted) are unreachable and left out, along with
 * their descendants, the same way Notion hides a trashed page's subpages.
 */
export function buildPageTree(rows: PageRow[]): PageNode[] {
  const nodes = new Map(rows.map((r) => [r.id, { ...r, children: [] as PageNode[] }]));
  const roots: PageNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) roots.push(node);
    else nodes.get(node.parentId)?.children.push(node);
  }
  return roots;
}

/** The chain from the root down to `id` (inclusive), or [] if unreachable. */
export function pagePath(rows: PageRow[], id: string): PageRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const path: PageRow[] = [];
  const seen = new Set<string>();
  for (let cur = byId.get(id); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    if (seen.has(cur.id)) return [];
    seen.add(cur.id);
    path.unshift(cur);
    if (cur.parentId === null) return path;
  }
  return [];
}

export function pageLabel(page: Pick<PageRow, "title">) {
  return page.title.trim() || "Untitled";
}
