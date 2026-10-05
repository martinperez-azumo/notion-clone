import {
  DeleteWorkspaceButton,
  InviteForm,
  InviteList,
  LeaveWorkspaceButton,
  MemberList,
  RenameWorkspaceForm,
} from "@/components/workspace-settings";
import { requireRole } from "@/lib/permissions";
import { listInvites, listMembers, listUserWorkspaces } from "@/lib/queries";
import { hasRole } from "@/lib/roles";

const ROLE_HELP = [
  ["Owner", "Everything, including renaming and deleting the workspace."],
  ["Admin", "Edit pages, invite people and change their roles."],
  ["Editor", "Create, edit and delete pages."],
  ["Viewer", "Read pages only."],
] as const;

export default async function SettingsPage(props: PageProps<"/w/[workspaceId]/settings">) {
  const { workspaceId } = await props.params;
  const me = await requireRole(workspaceId, "viewer");
  const isAdmin = hasRole(me.role, "admin");
  const [workspaces, members, invites] = await Promise.all([
    listUserWorkspaces(me.userId),
    listMembers(workspaceId),
    isAdmin ? listInvites(workspaceId) : [],
  ]);
  const name = workspaces.find((w) => w.id === workspaceId)?.name ?? "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-12 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings &amp; members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re <span className="font-medium">{me.role}</span> of {name}.
        </p>
      </div>

      {me.role === "owner" && (
        <Section title="General">
          <RenameWorkspaceForm workspaceId={workspaceId} name={name} />
        </Section>
      )}

      <Section
        title={`Members (${members.length})`}
        description={isAdmin ? undefined : "Only admins and the owner can manage members."}
      >
        <MemberList workspaceId={workspaceId} members={members} me={me} />
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {ROLE_HELP.map(([role, help]) => (
            <div key={role} className="contents">
              <dt className="font-medium text-foreground/80">{role}</dt>
              <dd>{help}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {isAdmin && (
        <Section
          title="Invite people"
          description="Azumo Google accounts only. People who have signed in before are added right away; everyone else joins on their first sign-in."
        >
          <InviteForm workspaceId={workspaceId} />
          {invites.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium">Pending invites</h3>
              <InviteList workspaceId={workspaceId} invites={invites} />
            </div>
          )}
        </Section>
      )}

      <Section title={me.role === "owner" ? "Danger zone" : "Leave"}>
        {me.role === "owner" ? (
          <DeleteWorkspaceButton workspaceId={workspaceId} name={name} />
        ) : (
          <LeaveWorkspaceButton workspaceId={workspaceId} name={name} />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
