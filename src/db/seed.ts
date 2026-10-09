import { config } from "dotenv";
import { seedDemo } from "./seed-demo";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const { db, pool } = await import("./index");

try {
  await db.transaction(seedDemo);
  console.log("Demo seed committed successfully.");
} catch {
  console.error("Demo seed failed; the transaction was rolled back.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
