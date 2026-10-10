"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { representatives } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getInstitution } from "@/lib/institution";
import { getLookups } from "@/lib/lookups";
import { parseCsv } from "@/lib/csv";
import { representativeSchema } from "@/lib/validators";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;

type Option = { id: number; name: string };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const truthy = (s: string | undefined, fallback: boolean) => {
  if (s === undefined || s.trim() === "") return fallback;
  return /^(true|yes|y|1)$/i.test(s.trim());
};

/** Resolves a name from the CSV to an id using the catalog. Blank means unassigned. */
function resolve(list: Option[], value: string | undefined): { id: string } | { error: string } | null {
  if (!value || value.trim() === "") return null;
  const hit = list.find((o) => norm(o.name) === norm(value));
  if (!hit) return { error: `"${value}" is not in the catalog` };
  return { id: String(hit.id) };
}

export async function importRepresentatives(formData: FormData) {
  const actor = await requireRole(["admin", "editor"]);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import?error=Choose+a+CSV+file+to+upload.");
  }
  if (file.size > MAX_BYTES) {
    redirect("/admin/import?error=The+file+is+larger+than+2+MB.");
  }

  const text = (await file.text()).replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (rows.length < 2) {
    redirect("/admin/import?error=The+file+needs+a+header+row+and+at+least+one+record.");
  }
  if (rows.length - 1 > MAX_ROWS) {
    redirect(`/admin/import?error=Import+is+limited+to+${MAX_ROWS}+rows+per+file.`);
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  if (!headers.includes("name")) {
    redirect("/admin/import?error=The+header+row+must+include+a+name+column.");
  }

  const lookups = await getLookups();
  const inst = await getInstitution();

  const valid: Record<string, unknown>[] = [];
  const problems: string[] = [];

  rows.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => (rec[h] = (cells[i] ?? "").trim()));

    const refs = {
      positionId: resolve(lookups.positions, rec.position),
      facultyId: resolve(lookups.faculties, rec.faculty),
      departmentId: resolve(lookups.departments, rec.department),
      programmeId: resolve(lookups.programmes, rec.programme),
      studyCentreId: resolve(lookups.studyCentres, rec.study_centre),
      stateId: resolve(lookups.states, rec.state),
      academicSessionId: resolve(lookups.sessions, rec.academic_session),
    };

    const refErrors = Object.entries(refs).filter(([, r]) => r && "error" in r).map(([, r]) => (r as { error: string }).error);
    if (refErrors.length) {
      problems.push(`Row ${line}: ${refErrors[0]}`);
      return;
    }

    const parsed = representativeSchema.safeParse({
      name: rec.name ?? "",
      email: rec.email ?? "",
      phone: rec.phone ?? "",
      bio: rec.bio ?? "",
      level: rec.level ?? "",
      imageUrl: rec.image_url ?? "",
      positionId: refs.positionId && "id" in refs.positionId ? refs.positionId.id : "",
      facultyId: refs.facultyId && "id" in refs.facultyId ? refs.facultyId.id : "",
      departmentId: refs.departmentId && "id" in refs.departmentId ? refs.departmentId.id : "",
      programmeId: refs.programmeId && "id" in refs.programmeId ? refs.programmeId.id : "",
      studyCentreId: refs.studyCentreId && "id" in refs.studyCentreId ? refs.studyCentreId.id : "",
      stateId: refs.stateId && "id" in refs.stateId ? refs.stateId.id : "",
      academicSessionId: refs.academicSessionId && "id" in refs.academicSessionId ? refs.academicSessionId.id : "",
      contactPublic: truthy(rec.contact_public, true),
    });

    if (!parsed.success) {
      problems.push(`Row ${line}: ${parsed.error.issues[0]?.message ?? "invalid data"}`);
      return;
    }

    valid.push({
      ...parsed.data,
      institutionId: inst.id,
      isArchived: truthy(rec.is_archived, false),
    });
  });

  if (valid.length > 0) {
    // Insert in chunks so large files do not exceed the parameter limit.
    for (let i = 0; i < valid.length; i += 200) {
      await db.insert(representatives).values(valid.slice(i, i + 200) as (typeof representatives.$inferInsert)[]);
    }
  }

  await logAudit({
    userId: actor.id,
    action: "import",
    entity: "representative",
    details: { file: file.name, imported: valid.length, skipped: problems.length },
  });

  revalidatePath("/directory");
  revalidatePath("/admin/representatives");

  const summary = `imported=${valid.length}&skipped=${problems.length}`;
  const sample = problems.length ? `&problems=${encodeURIComponent(problems.slice(0, 8).join(" | "))}` : "";
  redirect(`/admin/import?${summary}${sample}`);
}
