import assert from "node:assert/strict";
import test from "node:test";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { seedDemo } from "./seed-demo";
import { representatives, users } from "./schema";

test("demo seed fills missing records and preserves records on rerun", {
  skip: process.env.RUN_DB_TESTS !== "1",
}, async () => {
  config({ path: ".env", quiet: true });
  config({ path: ".env.local", override: true, quiet: true });
  const { db, pool } = await import("./index");
  const rollback = new Error("Roll back verification data");
  const tables = ["institution", "state", "faculty", "department", "programme", "study_centre", "academic_session", "position", "user", "representative"];
  try {
    await assert.rejects(db.transaction(async (tx) => {
      await seedDemo(tx);
      const [demo] = await tx.select().from(representatives)
        .where(eq(representatives.email, "chidi.o@noun.edu.ng")).limit(1);
      assert.ok(demo);
      await tx.delete(representatives).where(eq(representatives.id, demo.id));
      await tx.update(users).set({ password: "verification-only-existing-password" })
        .where(eq(users.email, "admin@noun.edu.ng"));

      await seedDemo(tx);
      const restored = await tx.select().from(representatives)
        .where(eq(representatives.email, "chidi.o@noun.edu.ng"));
      assert.ok(restored.some((row) => row.institutionId === demo.institutionId));
      const snapshot = async () => {
        const rows = [];
        for (const table of tables) {
          rows.push((await tx.execute(sql.raw(`select * from "${table}" order by id`))).rows);
        }
        return rows;
      };
      const beforeRerun = await snapshot();
      await seedDemo(tx);
      assert.deepEqual(await snapshot(), beforeRerun);
      const [admin] = await tx.select().from(users).where(eq(users.email, "admin@noun.edu.ng"));
      assert.equal(admin.password, "verification-only-existing-password");
      throw rollback;
    }), (error) => error === rollback);
  } finally {
    await pool.end();
  }
});
