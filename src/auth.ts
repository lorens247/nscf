import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

/**
 * AUTH_SECRET must be set in any deployment with more than one instance or where
 * sessions should survive a restart. When it is absent we fall back to a random
 * per-process secret rather than a hard-coded one: sessions then end when the
 * process restarts, but signing in still works and no shared constant is committed.
 */
const globalForSecret = globalThis as typeof globalThis & { __nounAuthSecret?: string };
const EPHEMERAL_SECRET = (() => {
  if (!globalForSecret.__nounAuthSecret) globalForSecret.__nounAuthSecret = randomBytes(32).toString("base64");
  return globalForSecret.__nounAuthSecret;
})();

if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== "test") {
  console.warn("[auth] AUTH_SECRET is not set. Using an ephemeral secret; set AUTH_SECRET so sessions survive restarts.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? EPHEMERAL_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  // The app is served behind a proxy on arbitrary hosts; trust the request host (also set via AUTH_TRUST_HOST).
  trustHost: true,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
        // Passwords are stored as bcrypt hashes. Users without a hash cannot sign in.
        if (!user || !user.password) return null;

        const ok = await compare(parsed.data.password, user.password);
        if (!ok) return null;

        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.uid ?? "");
      session.user.role = String(token.role ?? "viewer");
      return session;
    },
  },
});
