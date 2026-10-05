"use client";

import { useRouter } from "next/navigation";

import { deletePage, restorePage } from "@/app/actions/pages";
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
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";

type Props = { workspaceId: string; pageId: string; title: string; canEdit: boolean };

/** Restore / delete-forever controls, used on a trashed page and in the Trash list. */
export function TrashActions({ workspaceId, pageId, title, canEdit }: Props) {
  const router = useRouter();
  const [pending, run] = useAction();
  if (!canEdit) return null;
  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => restorePage(pageId))}>
        Restore
      </Button>
      <AlertDialog>
        <AlertDialogTrigger render={<Button size="sm" variant="destructive" disabled={pending} />}>
          Delete forever
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{title}&rdquo; forever?</AlertDialogTitle>
            <AlertDialogDescription>
              The page and all of its subpages will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                run(
                  () => deletePage(pageId),
                  () => router.push(`/w/${workspaceId}/trash`),
                )
              }
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
