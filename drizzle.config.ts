import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL },
  tablesFilter: [
    "institution", "state", "faculty", "department", "programme",
    "study_centre", "academic_session", "position", "user",
    "representative", "audit_log", "privacy_setting",
  ],
});
