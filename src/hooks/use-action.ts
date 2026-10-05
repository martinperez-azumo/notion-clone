"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type Result = { error?: string } | void | undefined;

/**
 * Runs a server action in a transition and shows its `{ error }` as a toast.
 * `onSuccess` is skipped on error. Actions that redirect navigate on their own.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
      else onSuccess?.();
    });
  }
  return [pending, run] as const;
}
