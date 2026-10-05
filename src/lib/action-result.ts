import "server-only";

import { ForbiddenError } from "@/lib/permissions";

/** What server actions return for errors the user should see. */
export type ActionResult = { error?: string };

/**
 * Turns expected failures into `{ error }` so the message reaches the UI
 * (Next.js hides thrown error messages in production). Anything else,
 * including notFound() and redirect(), is rethrown.
 */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const error = await fn();
    return error ? { error } : {};
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
}
