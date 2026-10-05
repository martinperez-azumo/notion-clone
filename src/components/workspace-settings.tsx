"use client";

import { LogOutIcon, UserMinusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  changeMemberRole,
  inviteMember,
  removeMember,
  revokeInvite,
} from "@/app/actions/members";
import { deleteWorkspace, leaveWorkspace, renameWorkspace } from "@/app/actions/workspaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/db/schema";
import { useAction } from "@/hooks/use-action";
import { ASSIGNABLE_ROLES, canManageMember } from "@/lib/member-rules";

const selectClass =
  "h-8 rounded-md border bg-background px-2 text-sm capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

export function RenameWorkspaceForm({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [value, setValue] = useState(name);
  const [pending, run] = useAction();
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => renameWorkspace(workspaceId, value),
          () => toast.success("Workspace renamed."),
        );
      }}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="ws-name">Name</Label>
        <Input id="ws-name" value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} />
      </div>
      <Button type="submit" variant="outline" disabled={pending || !value.trim() || value === name}>
        Save
      </Button>
    </form>
  );
}

type Member = { userId: string; email: string; name: string | null; image: string | null; role: Role };

export function MemberList({
  workspaceId,
  members,
  me,
}: {
  workspaceId: string;
  members: Member[];
  me: { userId: string; role: Role };
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {members.map((m) => (
        <MemberRow key={m.userId} workspaceId={workspaceId} member={m} me={me} />
      ))}
    </ul>
  );
}

function MemberRow({
  workspaceId,
  member,
  me,
}: {
  workspaceId: string;
  member: Member;
  me: { userId: string; role: Role };
}) {
  const [pending, run] = useAction();
  const manageable = canManageMember(me, member);
  const isMe = member.userId === me.userId;
  const label = member.name || member.email;

  return (
    <li className={`flex items-center gap-3 px-4 py-3 text-sm ${pending ? "opacity-60" : ""}`}>
      <Avatar className="size-8">
        {member.image && <AvatarImage src={member.image} alt="" />}
        <AvatarFallback>{label.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {label}
          {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      {manageable ? (
        <>
          <select
            aria-label={`Role for ${label}`}
            className={selectClass}
            value={member.role}
            disabled={pending}
            onChange={(e) => {
              const role = e.target.value;
              run(() => changeMemberRole(workspaceId, member.userId, role));
            }}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ConfirmButton
            title={`Remove ${label}?`}
            description="They'll lose access to this workspace and all of its pages."
            confirmLabel="Remove"
            disabled={pending}
            onConfirm={() => run(() => removeMember(workspaceId, member.userId))}
          >
            <UserMinusIcon />
            <span className="sr-only">Remove {label}</span>
          </ConfirmButton>
        </>
      ) : (
        <span className="text-sm text-muted-foreground capitalize">{member.role}</span>
      )}
    </li>
  );
}

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("editor");
  const [pending, run] = useAction();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => inviteMember(workspaceId, email, role),
          () => {
            toast.success(`Invited ${email.trim()}.`);
            setEmail("");
          },
        );
      }}
    >
      <div className="flex min-w-60 flex-1 flex-col gap-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@azumo.co"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          className={selectClass}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending || !email.trim()}>
        {pending ? "Inviting…" : "Invite"}
      </Button>
    </form>
  );
}

export function InviteList({
  workspaceId,
  invites,
}: {
  workspaceId: string;
  invites: { id: string; email: string; role: Role }[];
}) {
  const [pending, run] = useAction();
  return (
    <ul className="divide-y rounded-lg border">
      {invites.map((invite) => (
        <li key={invite.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="min-w-0 flex-1 truncate">{invite.email}</span>
          <span className="text-muted-foreground capitalize">{invite.role}</span>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={pending}
            aria-label={`Revoke invite for ${invite.email}`}
            onClick={() => run(() => revokeInvite(workspaceId, invite.id))}
          >
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function DeleteWorkspaceButton({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      title={`Delete “${name}”?`}
      description="All pages, members and invites in this workspace will be permanently deleted. This can't be undone."
      confirmLabel="Delete workspace"
      variant="destructive"
      disabled={pending}
      onConfirm={() => run(() => deleteWorkspace(workspaceId))}
    >
      Delete workspace
    </ConfirmButton>
  );
}

export function LeaveWorkspaceButton({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [pending, run] = useAction();
  return (
    <ConfirmButton
      title={`Leave “${name}”?`}
      description="You'll lose access until someone invites you again."
      confirmLabel="Leave"
      variant="outline"
      disabled={pending}
      onConfirm={() => run(() => leaveWorkspace(workspaceId))}
    >
      <LogOutIcon />
      Leave workspace
    </ConfirmButton>
  );
}

function ConfirmButton({
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
  variant = "ghost",
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: "ghost" | "outline" | "destructive";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button size={variant === "ghost" ? "icon-sm" : "default"} variant={variant} disabled={disabled} />}
      >
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
