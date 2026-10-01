import { requireRole } from "@/lib/permissions";

export default async function WorkspacePage(
  props: PageProps<"/w/[workspaceId]">,
) {
  const { workspaceId } = await props.params;
  const { role } = await requireRole(workspaceId, "viewer");

  return (
    <div className="mx-auto max-w-3xl px-12 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
      <p className="mt-2 text-muted-foreground">
        You&apos;re signed in as <span className="font-medium">{role}</span> of this
        workspace. Pages arrive on day 2.
      </p>
    </div>
  );
}
