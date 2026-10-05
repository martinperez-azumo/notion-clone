"use client";

import { useState } from "react";

import { createWorkspace } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";

/** Name field + submit. The action redirects to the new workspace. */
export function CreateWorkspaceForm({ autoFocus }: { autoFocus?: boolean }) {
  const [name, setName] = useState("");
  const [pending, run] = useAction();
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createWorkspace(name));
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Delivery team"
          maxLength={80}
          autoFocus={autoFocus}
          required
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}
