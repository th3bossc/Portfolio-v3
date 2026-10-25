import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { authConfigured, isAllowedAdmin } from "@/lib/access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub({ authorization: { params: { scope: "read:user" } } })],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin", error: "/admin" },
  callbacks: {
    signIn({ account, profile }) {
      return account?.provider === "github" && isAllowedAdmin(profile?.id);
    },
    jwt({ token, account }) {
      if (account) token.adminId = account.provider === "github" ? account.providerAccountId : undefined;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = isAllowedAdmin(token.adminId) ? String(token.adminId) : "";
      return session;
    },
  },
});

export async function requireAdmin() {
  if (!authConfigured()) throw new Error("Unauthorized");
  const session = await auth();
  if (!session?.user || !isAllowedAdmin(session.user.id)) throw new Error("Unauthorized");
  return session;
}
