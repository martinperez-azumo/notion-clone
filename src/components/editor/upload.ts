import { upload } from "@vercel/blob/client";

import { recordAttachment } from "@/app/actions/pages";
import {
  isAllowedContentType,
  MAX_FILE_BYTES,
  pageUploadPrefix,
  safeFileName,
} from "@/lib/file-rules";

/**
 * Uploads straight from the browser to the private Blob store, then records
 * the attachment. Resolves to the app URL the editor embeds; throws a
 * user-facing message on failure (BlockNote shows the block as failed).
 */
export async function uploadPageFile(pageId: string, file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Files can be up to ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
  }
  if (file.type && !isAllowedContentType(file.type)) {
    throw new Error("That file type isn't supported.");
  }

  let blobUrl: string;
  try {
    const blob = await upload(pageUploadPrefix(pageId) + safeFileName(file.name), file, {
      access: "private",
      handleUploadUrl: "/api/files/upload",
      clientPayload: pageId,
      multipart: file.size > 5 * 1024 * 1024,
    });
    blobUrl = blob.url;
  } catch (e) {
    // The upload route's message comes through in the error text.
    throw new Error(e instanceof Error && e.message ? e.message : "The upload failed.");
  }

  const result = await recordAttachment(pageId, blobUrl, file.name);
  if (result.error || !result.url) throw new Error(result.error ?? "The upload failed.");
  return result.url;
}
