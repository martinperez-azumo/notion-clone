"use client";

import { SmilePlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { updatePageIcon, updatePageTitle } from "@/app/actions/pages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";

const ICONS = [
  "📄", "📝", "📌", "📎", "📚", "📅", "✅", "💡",
  "🚀", "🎯", "📊", "🧭", "🛠️", "🔒", "⭐", "🔥",
  "🧪", "💬", "🗂️", "🏁", "🌱", "🎨", "⚙️", "🤝",
];
const TITLE_SAVE_DELAY_MS = 500;

type Props = { pageId: string; title: string; icon: string | null; editable: boolean };

export function PageHeader({ pageId, title: initialTitle, icon, editable }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [, run] = useAction();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(title);

  function onTitleChange(value: string) {
    setTitle(value);
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(saveTitle, TITLE_SAVE_DELAY_MS);
  }

  async function saveTitle() {
    timer.current = null;
    const result = await updatePageTitle(pageId, latest.current);
    if (result.error) toast.error(result.error);
  }

  // Don't drop a title typed just before navigating away.
  const saveRef = useRef(saveTitle);
  useEffect(() => {
    saveRef.current = saveTitle;
  });
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void saveRef.current();
      }
    },
    [],
  );

  return (
    <div className="group/header flex flex-col gap-2">
      {editable ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={
              icon
                ? "w-fit rounded-md p-1 text-6xl leading-none hover:bg-muted"
                : "flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground opacity-0 group-hover/header:opacity-100 hover:bg-muted focus-visible:opacity-100 data-[popup-open]:opacity-100"
            }
            aria-label={icon ? "Change icon" : "Add icon"}
          >
            {icon ?? (
              <>
                <SmilePlusIcon className="size-4" />
                Add icon
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto p-2">
            <div className="grid grid-cols-8 gap-1">
              {ICONS.map((emoji) => (
                <DropdownMenuItem
                  key={emoji}
                  className="justify-center p-1 text-xl"
                  onClick={() => run(() => updatePageIcon(pageId, emoji))}
                >
                  {emoji}
                </DropdownMenuItem>
              ))}
            </div>
            {icon && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => run(() => updatePageIcon(pageId, null))}>
                  Remove icon
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        icon && <span className="p-1 text-6xl leading-none">{icon}</span>
      )}
      <textarea
        value={title}
        onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        readOnly={!editable}
        rows={1}
        maxLength={200}
        placeholder="Untitled"
        aria-label="Page title"
        className="w-full resize-none bg-transparent text-4xl font-bold tracking-tight outline-none [field-sizing:content] placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
