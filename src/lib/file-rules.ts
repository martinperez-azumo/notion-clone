/** Upload rules shared by the browser (early feedback) and the server (enforcement). */

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
];

/** Types a browser can safely show inline; everything else downloads. */
const INLINE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
]);

export function isAllowedContentType(type: string) {
  return ALLOWED_CONTENT_TYPES.includes(type.split(";")[0].trim().toLowerCase());
}

export function isInlineContentType(type: string) {
  return INLINE_TYPES.has(type.split(";")[0].trim().toLowerCase());
}

/** Every upload for a page lives under this Blob path. */
export function pageUploadPrefix(pageId: string) {
  return `pages/${pageId}/`;
}

/** Keeps letters, digits, dot, dash and underscore; never empty, never a path. */
export function safeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100);
  return cleaned || "file";
}

/** The URL the app serves an attachment from (permission-checked). */
export function attachmentUrl(id: string) {
  return `/api/files/${id}`;
}
