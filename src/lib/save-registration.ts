import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { db as database } from "@/db";
import { auditLogs, representativeInvites, representativePhotos, representatives } from "@/db/schema";
import { getRegistrationLookups } from "@/lib/registration-lookups";
import type { RepresentativeInput } from "@/lib/validators";

export const accessError = "This code is invalid, expired, or already used. Ask your administrator for a new code.";
type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0];
export type RegistrationPhoto = { contentType: string; data: string };

export function availableInvite(codeHash: string) {
  return and(eq(representativeInvites.codeHash, codeHash), isNull(representativeInvites.usedAt), gt(representativeInvites.expiresAt, new Date()));
}

/** The caller wraps this operation in a transaction so code, profile and photo commit together. */
export async function saveRegistration(tx: Transaction, hash: string, data: RepresentativeInput, photo?: RegistrationPhoto): Promise<{ id: number } | { error: string }> {
  const [invite] = await tx.select().from(representativeInvites).where(availableInvite(hash)).limit(1).for("update");
  if (!invite || invite.usedAt || invite.expiresAt <= new Date()) return { error: accessError };
  if (!data.email) return { error: "Email is required for registration." };
  const email = data.email.toLowerCase();
  const lookups = await getRegistrationLookups(invite.institutionId, tx);
  const selections = {
    positionId: lookups.positions, facultyId: lookups.faculties, departmentId: lookups.departments,
    programmeId: lookups.programmes, studyCentreId: lookups.studyCentres, academicSessionId: lookups.sessions, stateId: lookups.states,
  };
  for (const [key, options] of Object.entries(selections)) {
    const id = data[key as keyof typeof selections];
    if (id !== null && !options.some((option) => option.id === id)) return { error: "A selected option is no longer available. Reopen the form and try again." };
  }
  if (data.departmentId !== null && !lookups.departments.some((department) => department.id === data.departmentId && department.facultyId === data.facultyId && data.facultyId !== null)) {
    return { error: "Choose a department in the selected faculty." };
  }
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${invite.institutionId}:${email}`}, 0))`);
  const [existing] = await tx.select({ id: representatives.id }).from(representatives)
    .where(and(eq(representatives.institutionId, invite.institutionId), sql`lower(${representatives.email}) = ${email}`)).limit(1);
  if (existing) return { error: "A profile with this email already exists. Contact your administrator to update it." };
  const [created] = await tx.insert(representatives).values({ ...data, email, institutionId: invite.institutionId, isArchived: false }).returning({ id: representatives.id });
  if (photo) {
    await tx.insert(representativePhotos).values({ representativeId: created.id, ...photo });
    await tx.update(representatives).set({ imageUrl: `/api/representatives/${created.id}/photo` }).where(eq(representatives.id, created.id));
  }
  await tx.update(representativeInvites).set({ usedAt: new Date(), representativeId: created.id }).where(eq(representativeInvites.id, invite.id));
  await tx.insert(auditLogs).values({ action: "self-register", entity: "representative", entityId: created.id, details: { invitationId: invite.id } });
  return created;
}
