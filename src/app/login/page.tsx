import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERRORS: Record<string, string> = {
  AccessDenied:
    "Only Azumo Google accounts (azumo.co or azumolabs.com) can sign in.",
  NoWorkspace: "We couldn't set up your workspace. Try signing in again.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  const { error } = await props.searchParams;
  const message =
    typeof error === "string"
      ? (ERRORS[error] ?? "Sign-in failed. Please try again.")
      : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Notion Clone</CardTitle>
          <CardDescription>Sign in with your Azumo Google account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {message && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {message}
            </p>
          )}
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
