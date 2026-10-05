"use client";

import { PlusIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { createPage } from "@/app/actions/pages";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils";

const itemClass =
  "flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm text-sidebar-foreground/80 hover:bg-muted";

export function SidebarNav({ workspaceId, canEdit }: { workspaceId: string; canEdit: boolean }) {
  const pathname = usePathname();
  const [pending, run] = useAction();
  const links = [
    { href: `/w/${workspaceId}/settings`, label: "Settings & members", icon: SettingsIcon },
    { href: `/w/${workspaceId}/trash`, label: "Trash", icon: Trash2Icon },
  ];
  return (
    <nav className="flex flex-col gap-px">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(itemClass, pathname === href && "bg-muted font-medium text-sidebar-foreground")}
        >
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </Link>
      ))}
      {canEdit && (
        <button
          type="button"
          className={cn(itemClass, pending && "opacity-60")}
          disabled={pending}
          onClick={() => run(() => createPage(workspaceId))}
        >
          <PlusIcon className="size-4 text-muted-foreground" />
          New page
        </button>
      )}
    </nav>
  );
}

