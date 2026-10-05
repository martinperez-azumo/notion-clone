"use client";

import "@blocknote/shadcn/style.css";

import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { savePageContent } from "@/app/actions/pages";

import { uploadPageFile } from "./upload";

const SAVE_DELAY_MS = 800;

type Status = "saved" | "unsaved" | "saving" | "error";

export type EditorProps = {
  pageId: string;
  initialContent: PartialBlock[] | null;
  editable: boolean;
};

/** BlockNote editor with debounced autosave. Client-only (loaded with ssr: false). */
export default function Editor({ pageId, initialContent, editable }: EditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
    uploadFile: editable
      ? async (file) => {
          try {
            return await uploadPageFile(pageId, file);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "The upload failed.");
            throw e;
          }
        }
      : undefined,
  });
  const [status, setStatus] = useState<Status>("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save() {
    timer.current = null;
    setStatus("saving");
    try {
      const result = await savePageContent(pageId, editor.document);
      if (result.error) throw new Error(result.error);
      // Typing during the request schedules another save; keep showing that.
      setStatus(timer.current ? "unsaved" : "saved");
    } catch (e) {
      setStatus("error");
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't save the page.");
    }
  }

  function scheduleSave() {
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY_MS);
  }

  // Flush a pending save when leaving the page, and warn before closing the tab.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (timer.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) {
        clearTimeout(timer.current);
        void saveRef.current();
      }
    };
  }, []);

  return (
    <div className="relative">
      {editable && (
        <p className="absolute -top-8 right-0 text-xs text-muted-foreground" aria-live="polite">
          {STATUS_LABEL[status]}
        </p>
      )}
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={editable ? scheduleSave : undefined}
        theme="light"
        className="-mx-[54px]"
      />
    </div>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Not saved",
};
