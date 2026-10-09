"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getInstitution } from "@/lib/institution";
import { formValues } from "@/lib/validators";

const schema = z.object({
  name: z.string().trim().min(3, "Enter the institution name").max(160),
  shortName: z.string().trim().min(2, "Enter a short name").max(20),
  motto: z.string().trim().max(160).transform((v) => (v === "" ? null : v)),
  directoryTitle: z.string().trim().min(3, "Enter a directory title").max(160),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Use an http(s) link or a /path")
    .transform((v) => (v === "" ? null : v)),
});

export async function updateInstitution(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const v = formValues(formData);

  const parsed = schema.safeParse({
    name: v.name ?? "",
    shortName: v.shortName ?? "",
    motto: v.motto ?? "",
    directoryTitle: v.directoryTitle ?? "",
    logoUrl: v.logoUrl ?? "",
  });
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`);
  }

  const inst = await getInstitution();
  await db.update(institutions).set({ ...parsed.data, updatedAt: new Date() }).where(eq(institutions.id, inst.id));

  await logAudit({ userId: actor.id, action: "update", entity: "institution", entityId: inst.id, details: { fields: Object.keys(parsed.data) } });

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
