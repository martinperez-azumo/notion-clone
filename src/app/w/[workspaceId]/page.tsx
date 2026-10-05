import { FileTextIcon } from "lucide-react";
import Link from "next/link";

import { NewPageButton } from "@/components/new-page-button";
import { buildPageTree, pageLabel } from "@/lib/page-tree";
import { requireRole } from "@/lib/permissions";
import { listPages, listUserWorkspaces } from "@/lib/queries";
import { hasRole } from "@/lib/roles";

export default async function WorkspacePage(
  props: PageProps<"/w/[workspaceId]">,
) {
  const { workspaceId } = await props.params;
  const { role, userId } = await requireRole(workspaceId, "viewer");
  const [workspaces, rows] = await Promise.all([
    listUserWorkspaces(userId),
    listPages(workspaceId),
  ]);
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const topLevel = buildPageTree(rows);
  const canEdit = hasRole(role, "editor");

  return (
    <div className="mx-auto max-w-3xl px-12 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">{workspace?.name}</h1>
      <p className="mt-2 text-muted-foreground">
        You&apos;re <span className="font-medium">{role}</span> of this workspace
        {canEdit ? "." : ", so pages are read-only for you."}
      </p>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Pages</h2>
        {canEdit && <NewPageButton workspaceId={workspaceId} />}
      </div>
      {topLevel.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {canEdit
            ? "No pages yet. Create the first one to get started."
            : "No pages yet. An editor needs to create one."}
        </p>
      ) : (
        <ul className="mt-2 divide-y rounded-lg border">
          {topLevel.map((page) => (
            <li key={page.id}>
              <Link
                href={`/w/${workspaceId}/p/${page.id}`}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                {page.icon ? (
                  <span className="w-4 text-center">{page.icon}</span>
                ) : (
                  <FileTextIcon className="size-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{pageLabel(page)}</span>
                {page.children.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {page.children.length} subpage{page.children.length === 1 ? "" : "s"}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
