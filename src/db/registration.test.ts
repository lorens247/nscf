import assert from "node:assert/strict";
import test from "node:test";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createRegistrationCode, hashRegistrationCode } from "../lib/representative-registration";
import { representativeSchema } from "../lib/validators";
import { institutions, representativeInvites, representativePhotos, representatives } from "./schema";

test("registration saves photos and rejects invalid, expired and reused codes", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  config({ path: ".env", quiet: true });
  config({ path: ".env.local", override: true, quiet: true });
  const { db, pool } = await import("./index");
  const { saveRegistration } = await import("../lib/save-registration");
  const rollback = new Error("Roll back registration verification");
  try {
    await assert.rejects(db.transaction(async (tx) => {
      const [institution] = await tx.select().from(institutions).limit(1);
      assert.ok(institution);
      const codeHash = hashRegistrationCode(createRegistrationCode())!;
      const expiredHash = hashRegistrationCode(createRegistrationCode())!;
      await tx.insert(representativeInvites).values([
        { codeHash, institutionId: institution.id, expiresAt: new Date(Date.now() + 60_000) },
        { codeHash: expiredHash, institutionId: institution.id, expiresAt: new Date(Date.now() - 60_000) },
      ]);
      const data = representativeSchema.parse({
        name: "Registration verification", email: `registration-${codeHash.slice(0, 12)}@example.invalid`, phone: "", bio: "Test profile", imageUrl: "",
        positionId: "", facultyId: "", departmentId: "", programmeId: "", studyCentreId: "", academicSessionId: "", stateId: "", contactPublic: false,
      });
      assert.ok("error" in await saveRegistration(tx, hashRegistrationCode(createRegistrationCode())!, data));
      assert.ok("error" in await saveRegistration(tx, expiredHash, data));
      const created = await saveRegistration(tx, codeHash, data, { contentType: "image/png", data: "verification-photo" });
      assert.ok("id" in created);
      const [profile] = await tx.select().from(representatives).where(eq(representatives.id, created.id));
      assert.equal(profile.imageUrl, `/api/representatives/${created.id}/photo`);
      assert.equal(profile.contactPublic, false);
      const [photo] = await tx.select().from(representativePhotos).where(eq(representativePhotos.representativeId, created.id));
      assert.equal(photo.contentType, "image/png");
      const [invite] = await tx.select().from(representativeInvites).where(eq(representativeInvites.codeHash, codeHash));
      assert.equal(invite.representativeId, created.id);
      assert.ok(invite.usedAt);
      assert.ok("error" in await saveRegistration(tx, codeHash, data));
      const duplicateCode = hashRegistrationCode(createRegistrationCode())!;
      await tx.insert(representativeInvites).values({ codeHash: duplicateCode, institutionId: institution.id, expiresAt: new Date(Date.now() + 60_000) });
      assert.ok("error" in await saveRegistration(tx, duplicateCode, data));
      const [unused] = await tx.select().from(representativeInvites).where(eq(representativeInvites.codeHash, duplicateCode));
      assert.equal(unused.usedAt, null);
      throw rollback;
    }), (error) => error === rollback);
  } finally { await pool.end(); }
});
