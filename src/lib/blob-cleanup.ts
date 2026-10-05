import "server-only";

import { del } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { attachments, pages } from "@/db/schema";

/** Blob URLs of every attachment on a page and all of its subpages. */
export async function attachmentUrlsForPageTree(pageId: string) {
  const result = await db.execute<{ url: string }>(sql`
    with recursive tree as (
      select id from ${pages} where id = ${pageId}
      union all
      select p.id from ${pages} p join tree on p.parent_id = tree.id
    )
    select ${attachments.url} as url from ${attachments}
    where ${attachments.pageId} in (select id from tree)
  `);
  return result.rows.map((r) => r.url);
}

export async function attachmentUrlsForWorkspace(workspaceId: string) {
  const rows = await db
    .select({ url: attachments.url })
    .from(attachments)
    .innerJoin(pages, eq(pages.id, attachments.pageId))
    .where(eq(pages.workspaceId, workspaceId));
  return rows.map((r) => r.url);
}

/**
 * True when a Blob store is connected: either a read-write token, or a store
 * id used with the Vercel OIDC token (the default for newly connected stores).
 */
export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/**
 * Best-effort removal of files whose rows were already deleted. A failure
 * leaves an orphaned file in the store, never a broken page, so it's only logged.
 */
export async function deleteBlobs(urls: string[]) {
  if (urls.length === 0 || !isBlobConfigured()) return;
  try {
    for (let i = 0; i < urls.length; i += 500) await del(urls.slice(i, i + 500));
  } catch (e) {
    console.error("[blob-cleanup]", e);
  }
}
