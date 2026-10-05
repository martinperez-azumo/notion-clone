import { redirect } from "next/navigation";

import { CreateWorkspaceForm } from "@/components/create-workspace-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/permissions";
import { listUserWorkspaces } from "@/lib/queries";

export default async function Home() {
  const { userId } = await requireUser();
  const [first] = await listUserWorkspaces(userId);
  if (first) redirect(`/w/${first.id}`);

  // Reached after leaving or deleting your last workspace.
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create a workspace</CardTitle>
          <CardDescription>You&apos;re not in any workspace right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm autoFocus />
        </CardContent>
      </Card>
    </main>
  );
}
