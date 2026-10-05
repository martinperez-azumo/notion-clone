"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

// Inside the workspace layout, so the sidebar stays usable when a page fails.
export default function WorkspaceError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-32 text-center">
      <TriangleAlertIcon className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page couldn&apos;t be shown. Try again, or pick another page in the sidebar.
      </p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
