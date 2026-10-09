"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLogs, representativeInvites } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { getInstitution } from "@/lib/institution";
import { createRegistrationCode, hashRegistrationCode } from "@/lib/representative-registration";

export type InvitationState = { codes?: { id: number; code: string }[]; expiresAt?: string; error?: string };
export async function createInvitation(_state: InvitationState, formData: FormData): Promise<InvitationState> {
  const user = await requireRole(["admin", "editor"]);
  const inst = await getInstitution();
  const quantity = Number(formData.get("quantity") ?? "1");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return { error: "Enter a quantity between 1 and 100." };
  const codes: { id: number; code: string }[] = [];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await db.transaction(async (tx) => {
      // The unique hash constraint also protects against collisions with older batches.
      for (let attempt = 0; codes.length < quantity && attempt < 5; attempt++) {
        const candidates = new Map<string, string>();
        while (candidates.size < quantity - codes.length) {
          const code = createRegistrationCode();
          candidates.set(hashRegistrationCode(code)!, code);
        }
        const created = await tx.insert(representativeInvites).values([...candidates.keys()].map((codeHash) => ({ codeHash, institutionId: inst.id, createdBy: user.id, expiresAt })))
          .onConflictDoNothing({ target: representativeInvites.codeHash }).returning({ id: representativeInvites.id, codeHash: representativeInvites.codeHash });
        codes.push(...created.map((invite) => ({ id: invite.id, code: candidates.get(invite.codeHash)! })));
      }
      if (codes.length !== quantity) throw new Error("Could not allocate the complete batch");
      await tx.insert(auditLogs).values(codes.map((invite) => ({ userId: user.id, action: "create", entity: "representative_invite", entityId: invite.id, details: { batchSize: quantity } })));

    });
  } catch {
    return { error: "Could not create access codes. Please try again." };
  }
  revalidatePath("/admin/invitations");
  revalidatePath("/admin");
  return { codes, expiresAt: expiresAt.toISOString() };
}

export async function revokeInvitation(formData: FormData) {
  const user = await requireRole(["admin", "editor"]);
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  const inst = await getInstitution();
  await db.transaction(async (tx) => {
    const rows = await tx.update(representativeInvites).set({ expiresAt: new Date() })
      .where(and(eq(representativeInvites.id, id), eq(representativeInvites.institutionId, inst.id), isNull(representativeInvites.usedAt))).returning({ id: representativeInvites.id });
    if (rows.length) await tx.insert(auditLogs).values({ userId: user.id, action: "revoke", entity: "representative_invite", entityId: id });
  });
  revalidatePath("/admin/invitations");
}
