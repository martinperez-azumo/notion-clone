import { notFound } from "next/navigation";

import { PageTree } from "@/components/page-tree";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { buildPageTree } from "@/lib/page-tree";
import { requireRole, requireUser } from "@/lib/permissions";
import { listPages, listUserWorkspaces } from "@/lib/queries";
import { hasRole } from "@/lib/roles";

export default async function WorkspaceLayout(
  props: LayoutProps<"/w/[workspaceId]">,
) {
  const { workspaceId } = await props.params;
  const { role } = await requireRole(workspaceId, "viewer");
  const { userId, user } = await requireUser();

  const [workspaces, pageRows] = await Promise.all([
    listUserWorkspaces(userId),
    listPages(workspaceId),
  ]);
  const current = workspaces.find((w) => w.id === workspaceId);
  if (!current) notFound();
  const canEdit = hasRole(role, "editor");

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col gap-3 border-r bg-muted/40 p-2">
        <WorkspaceSwitcher current={current} workspaces={workspaces} />
        <SidebarNav workspaceId={workspaceId} canEdit={canEdit} />
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <p className="px-2 text-xs font-medium text-muted-foreground">Pages</p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PageTree workspaceId={workspaceId} tree={buildPageTree(pageRows)} canEdit={canEdit} />
          </div>
        </div>
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">{props.children}</main>
    </div>
  );
}
