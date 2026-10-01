import { redirect } from "next/navigation";

import { requireUser } from "@/lib/permissions";
import { listUserWorkspaces } from "@/lib/queries";

export default async function Home() {
  const { userId } = await requireUser();
  const [first] = await listUserWorkspaces(userId);
  // Every user gets a personal workspace on sign-in, so this is a fallback.
  if (!first) redirect("/login?error=NoWorkspace");
  redirect(`/w/${first.id}`);
}
