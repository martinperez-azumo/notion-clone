"use client";

import dynamic from "next/dynamic";

import type { EditorProps } from "./editor";

// BlockNote touches the DOM on creation, so it can't render on the server.
const Editor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-3 pt-1" aria-hidden>
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  ),
});

export function PageEditor(props: EditorProps) {
  return <Editor {...props} />;
}
