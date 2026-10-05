import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { attachments, pages } from "@/db/schema";
import { isInlineContentType } from "@/lib/file-rules";
import { getMembership, isUuid } from "@/lib/permissions";

const notFound = () => new Response("Not found", { status: 404 });

/**
 * Streams a private attachment to members of its workspace. Everyone else,
 * including signed-out users, gets a 404 so file ids reveal nothing.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  const userId = (await auth())?.user?.id;
  if (!userId || !isUuid(id)) return notFound();

  const [file] = await db
    .select({
      url: attachments.url,
      name: attachments.name,
      mimeType: attachments.mimeType,
      workspaceId: pages.workspaceId,
    })
    .from(attachments)
    .innerJoin(pages, eq(pages.id, attachments.pageId))
    .where(eq(attachments.id, id))
    .limit(1);
  if (!file || !(await getMembership(file.workspaceId, userId))) return notFound();

  const blob = await get(file.url, { access: "private" });
  if (!blob || blob.statusCode !== 200) return notFound();

  const inline = isInlineContentType(file.mimeType);
  return new Response(blob.stream, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
