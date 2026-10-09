"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getInstitution } from "@/lib/institution";
import { PRIVACY_KEYS, savePrivacy, type PrivacyKey } from "@/lib/privacy";

export async function updatePrivacy(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const institution = await getInstitution();

  const enabled = new Set(formData.getAll("enabled").map(String));
  const changes: Record<string, boolean> = {};

  for (const entry of PRIVACY_KEYS) {
    const next = enabled.has(entry.key);
    changes[entry.key] = next;
    await savePrivacy(entry.key as PrivacyKey, next, institution.id);
  }

  await logAudit({ userId: actor.id, action: "update", entity: "privacy", details: changes });

  revalidatePath("/directory");
  revalidatePath("/", "layout");
  redirect("/admin/privacy?saved=1");
}
