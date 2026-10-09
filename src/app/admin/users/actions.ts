"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ROLES, requireRole, type Role } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getInstitution } from "@/lib/institution";
import { formValues } from "@/lib/validators";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter the user's name").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address"),
  password: z.string().min(10, "Password must be at least 10 characters").max(200),
  role: z.enum(ROLES, { message: "Choose a role" }),
});

function back(extra: string): never {
  redirect(`/admin/users?${extra}`);
}

export async function createUser(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const v = formValues(formData);

  const parsed = createUserSchema.safeParse({ name: v.name ?? "", email: v.email ?? "", password: v.password ?? "", role: v.role ?? "" });
  if (!parsed.success) back(`error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`);

  const inst = await getInstitution();
  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const [created] = await db
      .insert(users)
      .values({ name: parsed.data.name, email: parsed.data.email, password: passwordHash, role: parsed.data.role, institutionId: inst.id })
      .returning({ id: users.id });
    await logAudit({ userId: actor.id, action: "create", entity: "user", entityId: created.id, details: { email: parsed.data.email, role: parsed.data.role } });
  } catch {
    back("error=That+email+already+has+an+account.");
  }

  revalidatePath("/admin/users");
  back("saved=created");
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "") as Role;

  if (!Number.isInteger(id) || id <= 0) back("error=Invalid+user.");
  if (!ROLES.includes(role)) back("error=Invalid+role.");
  if (id === actor.id) back("error=You+cannot+change+your+own+role.");

  const [before] = await db.select({ role: users.role, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  if (!before) back("error=User+not+found.");

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  await logAudit({ userId: actor.id, action: "update", entity: "user", entityId: id, details: { email: before.email, from: before.role, to: role } });

  revalidatePath("/admin/users");
  back("saved=role");
}
