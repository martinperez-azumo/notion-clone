import type { PartialBlock } from "@blocknote/core";
import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageEditor } from "@/components/editor";
import { PageHeader } from "@/components/page-header";
import { TrashActions } from "@/components/trash-actions";
import { pageLabel, pagePath } from "@/lib/page-tree";
import { isUuid, requireRole } from "@/lib/permissions";
import { getPage, listPages } from "@/lib/queries";
import { hasRole } from "@/lib/roles";

export default async function PageView(
  props: PageProps<"/w/[workspaceId]/p/[pageId]">,
) {
  const { workspaceId, pageId } = await props.params;
  const { role } = await requireRole(workspaceId, "viewer");
  if (!isUuid(pageId)) notFound();
  const [page, rows] = await Promise.all([getPage(workspaceId, pageId), listPages(workspaceId)]);
  if (!page) notFound();

  const canEdit = hasRole(role, "editor");
  const trashed = page.archivedAt !== null;
  const editable = canEdit && !trashed;
  const crumbs = pagePath(rows, page.id);

  return (
    // `key` resets the title and editor state when moving between pages.
    <div key={page.id} className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-11 items-center gap-1 bg-background/90 px-4 text-sm backdrop-blur">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-muted-foreground">
          {crumbs.slice(0, -1).map((c) => (
            <span key={c.id} className="flex min-w-0 items-center gap-1">
              <Link href={`/w/${workspaceId}/p/${c.id}`} className="truncate rounded px-1 hover:bg-muted">
                {c.icon && `${c.icon} `}
                {pageLabel(c)}
              </Link>
              <span>/</span>
            </span>
          ))}
          <span className="truncate px-1 text-foreground">
            {page.icon && `${page.icon} `}
            {pageLabel(page)}
          </span>
        </nav>
        {!canEdit && (
          <span className="ml-auto rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            View only
          </span>
        )}
      </header>

      {trashed && (
        <div className="flex items-center gap-3 bg-destructive/10 px-6 py-2 text-sm text-destructive">
          <Trash2Icon className="size-4 shrink-0" />
          <span className="flex-1">This page is in the trash.</span>
          <TrashActions
            workspaceId={workspaceId}
            pageId={page.id}
            title={pageLabel(page)}
            canEdit={canEdit}
          />
        </div>
      )}

      <article className="mx-auto w-full max-w-3xl px-14 pt-16 pb-40">
        <PageHeader pageId={page.id} title={page.title} icon={page.icon} editable={editable} />
        <div className="mt-10">
          <PageEditor
            pageId={page.id}
            initialContent={(page.content as PartialBlock[] | null) ?? null}
            editable={editable}
          />
        </div>
      </article>
    </div>
  );
}
