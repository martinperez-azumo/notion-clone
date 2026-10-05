import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

// Also shown for workspaces and pages you're not a member of, on purpose.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been deleted, or you may not have access to it. Ask an admin of the
        workspace to invite you.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        Go to my workspaces
      </Link>
    </main>
  );
}
