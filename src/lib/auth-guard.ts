import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

/** Returns the signed-in admin user or redirects to the login page. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = ROLES.includes(session.user.role as Role) ? (session.user.role as Role) : "viewer";
  return {
    id: Number(session.user.id),
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role,
  };
}

/** Use in server components and server actions. Redirects when the role is not allowed. */
export async function requireRole(allowed: readonly Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!allowed.includes(user.role)) redirect("/admin?forbidden=1");
  return user;
}

export const canWrite = (role: Role) => role === "admin" || role === "editor";
export const isAdmin = (role: Role) => role === "admin";
