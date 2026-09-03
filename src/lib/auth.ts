import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyTotpToken } from "@/server/services/mfa/mfa";

/**
 * NextAuth configuration (spec §5, §25).
 *
 * - Credentials provider: email + password, hashed with bcrypt, never
 *   stored or compared in plaintext.
 * - Google / Microsoft (Azure AD) OAuth: enabled automatically once the
 *   corresponding env vars are present.
 * - Sessions are JWT-based (httpOnly, secure cookies in production —
 *   configured via NextAuth's defaults + `useSecureCookies` below).
 * - MFA: implemented as a two-step credentials flow. If `user.mfaEnabled`
 *   and no `totpCode` was submitted, authorize() throws a distinguishable
 *   "MFA_REQUIRED" error rather than returning null — the sign-in UI
 *   catches that specific message and re-prompts for a 6-digit code in
 *   the same form, then resubmits with `totpCode` included. An invalid
 *   code throws "MFA_INVALID" so the UI can show a specific message
 *   rather than a generic "wrong password."
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  useSecureCookies: env.NODE_ENV === "production",
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authentication code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user || !user.passwordHash || !user.isActive) return null;

        const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!validPassword) return null;

        if (user.mfaEnabled) {
          if (!user.mfaSecret) {
            // Data integrity issue (enabled but no secret) — fail closed.
            throw new Error("MFA_INVALID");
          }
          if (!credentials.totpCode) {
            throw new Error("MFA_REQUIRED");
          }
          const validTotp = verifyTotpToken(credentials.totpCode, user.mfaSecret);
          if (!validTotp) {
            throw new Error("MFA_INVALID");
          }
        }

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })]
      : []),
    ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
            tenantId: env.MICROSOFT_TENANT_ID,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
};

