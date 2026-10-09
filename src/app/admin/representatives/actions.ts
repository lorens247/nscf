"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { representatives } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { departmentSelectionError } from "@/lib/department-selection";
import { getInstitution } from "@/lib/institution";
import type { FormState } from "@/lib/form-state";
import { formValues, issuesToFieldErrors, representativeSchema } from "@/lib/validators";

const WRITE = ["admin", "editor"] as const;

function readRepresentativeForm(formData: FormData) {
  const v = formValues(formData);
  return {
    name: v.name ?? "",
    email: v.email ?? "",
    phone: v.phone ?? "",
    bio: v.bio ?? "",
    imageUrl: v.imageUrl ?? "",
    positionId: v.positionId ?? "",
    facultyId: v.facultyId ?? "",
    departmentId: v.departmentId ?? "",
    programmeId: v.programmeId ?? "",
    studyCentreId: v.studyCentreId ?? "",
    academicSessionId: v.academicSessionId ?? "",
    stateId: v.stateId ?? "",
    contactPublic: formData.get("contactPublic") === "on",
  };
}

function revalidateDirectory(id?: number) {
  revalidatePath("/directory");
  revalidatePath("/");
  revalidatePath("/admin/representatives");
  if (id) revalidatePath(`/directory/${id}`);
}

export async function createRepresentative(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(WRITE);
  const values = formValues(formData);

  const parsed = representativeSchema.safeParse(readRepresentativeForm(formData));
  if (!parsed.success) {
    return { error: "Please correct the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error), values };
  }

  const departmentError = await departmentSelectionError(parsed.data.facultyId, parsed.data.departmentId);
  if (departmentError) return { error: "Please correct the highlighted fields.", fieldErrors: { departmentId: departmentError }, values };

  const inst = await getInstitution();
  const [created] = await db
    .insert(representatives)
    .values({ ...parsed.data, institutionId: inst.id, isArchived: false })
    .returning({ id: representatives.id });

  await logAudit({
    userId: user.id,
    action: "create",
    entity: "representative",
    entityId: created.id,
    details: { name: parsed.data.name },
  });

  revalidateDirectory(created.id);
  redirect(`/admin/representatives?saved=created`);
}

export async function updateRepresentative(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(WRITE);
  const id = Number(formData.get("id"));
  const values = formValues(formData);
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid record." };

  const parsed = representativeSchema.safeParse(readRepresentativeForm(formData));
  if (!parsed.success) {
    return { error: "Please correct the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error), values };
  }

  const departmentError = await departmentSelectionError(parsed.data.facultyId, parsed.data.departmentId);
  if (departmentError) return { error: "Please correct the highlighted fields.", fieldErrors: { departmentId: departmentError }, values };

  const [before] = await db.select().from(representatives).where(eq(representatives.id, id)).limit(1);
  if (!before) return { error: "This representative no longer exists." };

  await db
    .update(representatives)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(representatives.id, id));

  await logAudit({
    userId: user.id,
    action: "update",
    entity: "representative",
    entityId: id,
    details: {
      changed: Object.keys(parsed.data).filter(
        (k) => String((before as Record<string, unknown>)[k] ?? "") !== String((parsed.data as Record<string, unknown>)[k] ?? ""),
      ),
    },
  });

  revalidateDirectory(id);
  redirect(`/admin/representatives?saved=updated`);
}

export async function setArchived(formData: FormData) {
  const user = await requireRole(WRITE);
  const id = Number(formData.get("id"));
  const archive = formData.get("archive") === "1";
  if (!Number.isInteger(id) || id <= 0) return;

  await db
    .update(representatives)
    .set({ isArchived: archive, updatedAt: new Date() })
    .where(eq(representatives.id, id));

  await logAudit({
    userId: user.id,
    action: archive ? "archive" : "restore",
    entity: "representative",
    entityId: id,
  });

  revalidateDirectory(id);
}

export async function deleteRepresentative(formData: FormData) {
  const user = await requireRole(["admin"]);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const [before] = await db.select({ name: representatives.name }).from(representatives).where(eq(representatives.id, id)).limit(1);
  await db.delete(representatives).where(eq(representatives.id, id));

  await logAudit({
    userId: user.id,
    action: "delete",
    entity: "representative",
    entityId: id,
    details: { name: before?.name ?? null },
  });

  revalidateDirectory(id);
  redirect("/admin/representatives?saved=deleted");
}
