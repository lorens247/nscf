import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { privacySettings } from "@/db/schema";

/**
 * Institution-wide privacy switches. The per-representative flag is still the
 * final say: a representative can always be more private than the setting allows.
 */
export type PrivacyKey = "emailPublic" | "phonePublic" | "showEmailInDirectory";

export type Privacy = Record<PrivacyKey, boolean>;

export const PRIVACY_KEYS: { key: PrivacyKey; column: string; label: string; help: string }[] = [
  {
    key: "emailPublic",
    column: "contact.email_public",
    label: "Allow email addresses to be shown",
    help: "When off, no email address appears anywhere on the public site, regardless of individual records.",
  },
  {
    key: "phonePublic",
    column: "contact.phone_public",
    label: "Allow phone numbers to be shown",
    help: "When off, no phone number appears anywhere on the public site, regardless of individual records.",
  },
  {
    key: "showEmailInDirectory",
    column: "directory.show_email",
    label: "Show email in directory listings",
    help: "Off by default, so listings stay compact and email is only revealed on a profile page.",
  },
];

export const PRIVACY_DEFAULTS: Privacy = {
  emailPublic: true,
  phonePublic: true,
  showEmailInDirectory: false,
};

const toBool = (value: string | undefined, fallback: boolean) => (value === undefined ? fallback : value === "true" || value === "1");

export const getPrivacy = cache(async (): Promise<Privacy> => {
  try {
    const rows = await db
      .select({ key: privacySettings.key, value: privacySettings.value })
      .from(privacySettings);
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      emailPublic: toBool(map.get("contact.email_public"), PRIVACY_DEFAULTS.emailPublic),
      phonePublic: toBool(map.get("contact.phone_public"), PRIVACY_DEFAULTS.phonePublic),
      showEmailInDirectory: toBool(map.get("directory.show_email"), PRIVACY_DEFAULTS.showEmailInDirectory),
    };
  } catch {
    return PRIVACY_DEFAULTS;
  }
});

export async function savePrivacy(key: PrivacyKey, enabled: boolean, institutionId: number) {
  const column = PRIVACY_KEYS.find((k) => k.key === key)!.column;
  const value = enabled ? "true" : "false";
  const [existing] = await db.select({ id: privacySettings.id }).from(privacySettings).where(eq(privacySettings.key, column)).limit(1);

  if (existing) {
    await db.update(privacySettings).set({ value, updatedAt: new Date() }).where(eq(privacySettings.key, column));
  } else {
    await db.insert(privacySettings).values({ key: column, value, institutionId });
  }
}

/** Combines the institution-wide switch with the representative's own choice. */
export function contactVisible(privacy: Privacy, representativeOptIn: boolean, field: "email" | "phone") {
  if (!representativeOptIn) return false;
  return field === "email" ? privacy.emailPublic : privacy.phonePublic;
}
