"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CreateWorkspaceForm } from "@/components/create-workspace-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Workspace = { id: string; name: string; role: string };

export function WorkspaceSwitcher({
  current,
  workspaces,
}: {
  current: Workspace;
  workspaces: Workspace[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  // Creating redirects into the new workspace; close the dialog when that lands.
  const [shownFor, setShownFor] = useState(current.id);
  if (shownFor !== current.id) {
    setShownFor(current.id);
    setCreating(false);
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-muted">
          <WorkspaceBadge name={current.name} />
          <span className="flex-1 truncate">{current.name}</span>
          <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((w) => (
              <DropdownMenuItem key={w.id} onClick={() => router.push(`/w/${w.id}`)}>
                <WorkspaceBadge name={w.name} />
                <span className="flex-1 truncate">{w.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{w.role}</span>
                {w.id === current.id && <CheckIcon />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreating(true)}>
            <PlusIcon />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>You&apos;ll be its owner and can invite people next.</DialogDescription>
          </DialogHeader>
          <CreateWorkspaceForm autoFocus />
        </DialogContent>
      </Dialog>
    </>
  );
}

function WorkspaceBadge({ name }: { name: string }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
