import { notFound } from "next/navigation";

import { UserMenu } from "@/components/user-menu";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { requireRole, requireUser } from "@/lib/permissions";
import { listUserWorkspaces } from "@/lib/queries";

export default async function WorkspaceLayout(
  props: LayoutProps<"/w/[workspaceId]">,
) {
  const { workspaceId } = await props.params;
  await requireRole(workspaceId, "viewer");
  const { userId, user } = await requireUser();

  const workspaces = await listUserWorkspaces(userId);
  const current = workspaces.find((w) => w.id === workspaceId);
  if (!current) notFound();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 shrink-0 flex-col gap-2 border-r bg-muted/40 p-2">
        <WorkspaceSwitcher current={current} workspaces={workspaces} />
        <nav className="flex-1 px-2 py-4 text-sm text-muted-foreground">
          No pages yet.
        </nav>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </aside>
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
