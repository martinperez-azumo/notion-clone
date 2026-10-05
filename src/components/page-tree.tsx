"use client";

import {
  ChevronRightIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { archivePage, createPage } from "@/app/actions/pages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { type PageNode, pageLabel } from "@/lib/page-tree";
import { cn } from "@/lib/utils";

type Props = { workspaceId: string; tree: PageNode[]; canEdit: boolean };

export function PageTree({ workspaceId, tree, canEdit }: Props) {
  const { pageId } = useParams<{ pageId?: string }>();
  const activePath = pageId ? findPath(tree, pageId) : [];
  if (tree.length === 0) {
    return (
      <p className="px-2 py-1 text-sm text-muted-foreground">
        {canEdit ? "No pages yet. Create one above." : "No pages yet."}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-px">
      {tree.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          workspaceId={workspaceId}
          activePath={activePath}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );
}

function TreeItem({
  node,
  depth,
  workspaceId,
  activePath,
  canEdit,
}: {
  node: PageNode;
  depth: number;
  workspaceId: string;
  activePath: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, run] = useAction();
  const isActive = activePath.at(-1) === node.id;
  // Expand when this becomes an ancestor of the open page; otherwise the user decides.
  const isAncestor = activePath.includes(node.id) && !isActive;
  const [open, setOpen] = useState(isAncestor);
  const [wasAncestor, setWasAncestor] = useState(isAncestor);
  if (isAncestor !== wasAncestor) {
    setWasAncestor(isAncestor);
    if (isAncestor) setOpen(true);
  }
  const hasChildren = node.children.length > 0;

  function addSubpage() {
    setOpen(true);
    run(() => createPage(workspaceId, node.id));
  }

  function moveToTrash() {
    run(
      () => archivePage(node.id),
      () => {
        // Leave the page if it, or one of its subpages, is the one being viewed.
        if (activePath.includes(node.id)) router.push(`/w/${workspaceId}`);
      },
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group/item flex h-7 items-center gap-1 rounded-md pr-1 text-sm text-sidebar-foreground/80 hover:bg-muted",
          isActive && "bg-muted font-medium text-sidebar-foreground",
          pending && "opacity-60",
        )}
        style={{ paddingLeft: 4 + depth * 12 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          aria-expanded={open}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10"
        >
          <ChevronRightIcon
            className={cn("size-3.5 transition-transform", open && "rotate-90")}
          />
        </button>
        <Link
          href={`/w/${workspaceId}/p/${node.id}`}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1"
        >
          {node.icon ? (
            <span className="w-4 shrink-0 text-center text-sm leading-none">{node.icon}</span>
          ) : (
            <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{pageLabel(node)}</span>
        </Link>
        {canEdit && (
          <div className="flex shrink-0 items-center opacity-0 group-hover/item:opacity-100 has-[[data-popup-open]]:opacity-100 focus-within:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Page actions"
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10"
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="start">
                <DropdownMenuItem onClick={addSubpage}>
                  <PlusIcon />
                  Add subpage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={moveToTrash}>
                  <Trash2Icon />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={addSubpage}
              aria-label="Add subpage"
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
      {open &&
        (hasChildren ? (
          <ul className="flex flex-col gap-px">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                workspaceId={workspaceId}
                activePath={activePath}
                canEdit={canEdit}
              />
            ))}
          </ul>
        ) : (
          <p
            className="py-1 text-xs text-muted-foreground"
            style={{ paddingLeft: 4 + (depth + 1) * 12 + 24 }}
          >
            No pages inside
          </p>
        ))}
    </li>
  );
}

function findPath(nodes: PageNode[], id: string): string[] {
  for (const node of nodes) {
    if (node.id === id) return [node.id];
    const sub = findPath(node.children, id);
    if (sub.length) return [node.id, ...sub];
  }
  return [];
}
