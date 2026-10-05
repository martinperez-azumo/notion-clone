import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { auth } from "@/auth";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_BYTES, pageUploadPrefix } from "@/lib/file-rules";
import { findPageAccess } from "@/lib/permissions";

class UploadDenied extends Error {}

/**
 * Issues short-lived tokens so the browser can upload straight to the private
 * Blob store. The token is scoped to one page's folder, the allowed types and
 * the size limit; the file is recorded afterwards by `recordAttachment`.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "File uploads aren't set up yet." }, { status: 503 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const userId = (await auth())?.user?.id;
        if (!userId) throw new UploadDenied("Your session expired. Sign in again.");
        const page = await findPageAccess(clientPayload, userId, "editor");
        if (!page) throw new UploadDenied("You can't upload files to this page.");
        if (page.archivedAt) throw new UploadDenied("Restore the page before adding files.");
        const prefix = pageUploadPrefix(page.id);
        if (!pathname.startsWith(prefix) || pathname.slice(prefix.length).includes("/")) {
          throw new UploadDenied("Invalid upload path.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (e) {
    const message = e instanceof UploadDenied ? e.message : "The upload couldn't be started.";
    if (!(e instanceof UploadDenied)) console.error("[upload]", e);
    return Response.json({ error: message }, { status: 400 });
  }
}
