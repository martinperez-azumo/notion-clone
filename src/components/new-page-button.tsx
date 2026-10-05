"use client";

import { PlusIcon } from "lucide-react";

import { createPage } from "@/app/actions/pages";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";

export function NewPageButton({ workspaceId }: { workspaceId: string }) {
  const [pending, run] = useAction();
  return (
    <Button size="sm" disabled={pending} onClick={() => run(() => createPage(workspaceId))}>
      <PlusIcon />
      New page
    </Button>
  );
}
