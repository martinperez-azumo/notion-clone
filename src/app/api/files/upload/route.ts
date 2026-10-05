import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";

import { auth } from "@/auth";
import { isBlobConfigured } from "@/lib/blob-cleanup";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_BYTES, pageUploadPrefix } from "@/lib/file-rules";
import { findPageAccess } from "@/lib/permissions";

class UploadDenied extends Error {}

const TOKEN_TTL_MS = 10 * 60 * 1000;

/**
 * Hands the browser a presigned URL to upload one file straight to the
 * private Blob store. The signed token is scoped to that exact pathname
 * (inside the page's folder), the allowed types and the size limit. The file
 * is recorded afterwards by `recordAttachment`.
 *
 * Presigned uploads work with both store credentials: a read-write token or
 * Vercel OIDC + BLOB_STORE_ID (what newly connected stores get).
 */
export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return Response.json({ error: "File uploads aren't set up yet." }, { status: 503 });
  }
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        const userId = (await auth())?.user?.id;
        if (!userId) throw new UploadDenied("Your session expired. Sign in again.");
        const page = await findPageAccess(clientPayload, userId, "editor");
        if (!page) throw new UploadDenied("You can't upload files to this page.");
        if (page.archivedAt) throw new UploadDenied("Restore the page before adding files.");
        const prefix = pageUploadPrefix(page.id);
        if (!pathname.startsWith(prefix) || pathname.slice(prefix.length).includes("/")) {
          throw new UploadDenied("Invalid upload path.");
        }
        const limits = {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          validUntil: Date.now() + TOKEN_TTL_MS,
        };
        const token = await issueSignedToken({ pathname, operations: ["put"], ...limits });
        return { token, urlOptions: { ...limits, allowOverwrite: false } };
      },
    });
    return Response.json(result);
  } catch (e) {
    const message = e instanceof UploadDenied ? e.message : "The upload couldn't be started.";
    if (!(e instanceof UploadDenied)) console.error("[upload]", e);
    return Response.json({ error: message }, { status: 400 });
  }
}
