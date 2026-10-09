import { cache } from "react";
import { db } from "@/db";
import { institutions } from "@/db/schema";

export type InstitutionInfo = {
  id: number;
  name: string;
  shortName: string;
  motto: string;
  directoryTitle: string;
  logoUrl: string | null;
};

const DEFAULTS: InstitutionInfo = {
  id: 1,
  name: "National Open University of Nigeria",
  shortName: "NOUN",
  motto: "Learn at any place at your pace.",
  directoryTitle: "NOUN Student Representatives Directory",
  logoUrl: "/logo.png",
};

/** Institution identity is read from the database so it can be changed from Admin → Settings. */
export const getInstitution = cache(async (): Promise<InstitutionInfo> => {
  try {
    const [row] = await db.select().from(institutions).limit(1);
    if (!row) return DEFAULTS;
    return {
      id: row.id,
      name: row.name,
      shortName: row.shortName,
      motto: row.motto ?? DEFAULTS.motto,
      directoryTitle: row.directoryTitle,
      logoUrl: row.logoUrl || null,
    };
  } catch {
    return DEFAULTS;
  }
});
