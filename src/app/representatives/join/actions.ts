"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { representativeInvites } from "@/db/schema";
import type { Lookups } from "@/components/representative-form";
import type { FormState } from "@/lib/form-state";
import { getRegistrationLookups } from "@/lib/registration-lookups";
import { hashRegistrationCode, MAX_PHOTO_BYTES, photoContentType } from "@/lib/representative-registration";
import { accessError, availableInvite, saveRegistration } from "@/lib/save-registration";
import { formValues, issuesToFieldErrors, representativeSchema } from "@/lib/validators";

export type AccessState = { error?: string; code?: string; lookups?: Lookups };

export async function unlockRegistration(_state: AccessState, formData: FormData): Promise<AccessState> {
  const code = String(formData.get("code") ?? "").slice(0, 128);
  const hash = hashRegistrationCode(code);
  if (!hash) return { error: accessError };
  try {
    const [invite] = await db.select().from(representativeInvites).where(availableInvite(hash)).limit(1);
    if (!invite) return { error: accessError };
    return { code, lookups: await getRegistrationLookups(invite.institutionId) };
  } catch {
    return { error: "We could not check your code. Please try again shortly." };
  }
}

export async function submitRegistration(_state: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  delete values.code;
  const hash = hashRegistrationCode(String(formData.get("code") ?? "").slice(0, 128));
  if (!hash) return { error: accessError, values };
  const parsed = representativeSchema.safeParse({
    ...Object.fromEntries(["name", "email", "phone", "bio", "level", "positionId", "facultyId", "departmentId", "programmeId", "studyCentreId", "academicSessionId", "stateId"].map((key) => [key, values[key] ?? ""])),
    imageUrl: "",
    contactPublic: formData.get("contactPublic") === "on",
  });
  if (!parsed.success) return { error: "Please correct the highlighted fields.", fieldErrors: issuesToFieldErrors(parsed.error), values };
  if (!parsed.data.email) return { error: "Please enter your email address.", fieldErrors: { email: "Email is required for registration." }, values };

  let photo: { contentType: string; data: string } | undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PHOTO_BYTES) return { error: "Please choose a smaller photo.", fieldErrors: { photo: "Photos must be 2 MB or smaller." }, values };
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = photoContentType(bytes);
    if (!contentType || file.type !== contentType) return { error: "Please choose a JPEG, PNG, or WebP photo.", fieldErrors: { photo: "Unsupported image format." }, values };
    photo = { contentType, data: bytes.toString("base64") };
  }

  let result: { id: number } | { error: string };
  try {
    result = await db.transaction((tx) => saveRegistration(tx, hash, parsed.data, photo));
  } catch {
    return { error: "We could not save your profile. Please try again. Your code has not been used.", values };
  }
  if ("error" in result) return { error: result.error, values };
  for (const path of ["/", "/directory", "/admin/representatives", "/admin/invitations"]) revalidatePath(path);
  redirect(`/representatives/join/success?id=${result.id}`);
}
