import { FileTextIcon } from "lucide-react";
import Link from "next/link";

import { TrashActions } from "@/components/trash-actions";
import { pageLabel } from "@/lib/page-tree";
import { requireRole } from "@/lib/permissions";
import { listArchivedPages } from "@/lib/queries";
import { hasRole } from "@/lib/roles";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function TrashPage(props: PageProps<"/w/[workspaceId]/trash">) {
  const { workspaceId } = await props.params;
  const { role } = await requireRole(workspaceId, "viewer");
  const trashed = await listArchivedPages(workspaceId);
  const canEdit = hasRole(role, "editor");

  return (
    <div className="mx-auto max-w-3xl px-12 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pages moved to the trash, with their subpages. Restore them or delete them for good.
      </p>
      {trashed.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          The trash is empty.
        </p>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border">
          {trashed.map((page) => (
            <li key={page.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              {page.icon ? (
                <span className="w-4 text-center">{page.icon}</span>
              ) : (
                <FileTextIcon className="size-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/w/${workspaceId}/p/${page.id}`} className="block truncate hover:underline">
                  {pageLabel(page)}
                </Link>
                {page.archivedAt && (
                  <p className="text-xs text-muted-foreground">
                    Trashed {dateFormat.format(page.archivedAt)} UTC
                  </p>
                )}
              </div>
              <TrashActions
                workspaceId={workspaceId}
                pageId={page.id}
                title={pageLabel(page)}
                canEdit={canEdit}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
