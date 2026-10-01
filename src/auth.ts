import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedEmail } from "@/lib/allowed-email";
import { onSignIn } from "@/lib/onboarding";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Returning false sends the user to /login?error=AccessDenied.
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      return profile?.email_verified === true && isAllowedEmail(profile.email);
    },
    async jwt({ token, profile }) {
      // `profile` is only present on the sign-in request itself.
      if (profile?.email) {
        token.uid = await onSignIn({
          email: profile.email,
          name: profile.name,
          image: typeof profile.picture === "string" ? profile.picture : null,
        });
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});
