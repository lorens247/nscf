import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, representatives, states, studyCentres } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-guard";
import { toCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const HEADERS = [
  "id", "name", "email", "phone", "bio", "image_url", "position", "faculty", "department", "programme",
  "study_centre", "state", "academic_session", "contact_public", "is_archived", "level",
];

/** Exports every representative (including archived) as CSV. Uses the same column names as the importer. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: representatives.id,
      name: representatives.name,
      email: representatives.email,
      phone: representatives.phone,
      bio: representatives.bio,
      level: representatives.level,
      imageUrl: representatives.imageUrl,
      contactPublic: representatives.contactPublic,
      isArchived: representatives.isArchived,
      position: positions.name,
      faculty: faculties.name,
      department: departments.name,
      programme: programmes.name,
      studyCentre: studyCentres.name,
      state: states.name,
      session: academicSessions.name,
    })
    .from(representatives)
    .leftJoin(positions, eq(representatives.positionId, positions.id))
    .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
    .leftJoin(departments, eq(representatives.departmentId, departments.id))
    .leftJoin(programmes, eq(representatives.programmeId, programmes.id))
    .leftJoin(studyCentres, eq(representatives.studyCentreId, studyCentres.id))
    .leftJoin(states, eq(representatives.stateId, states.id))
    .leftJoin(academicSessions, eq(representatives.academicSessionId, academicSessions.id))
    .orderBy(representatives.name);

  const body = toCsv([
    HEADERS,
    ...rows.map((r) => [
      r.id, r.name, r.email, r.phone, r.bio, r.imageUrl, r.position, r.faculty, r.department, r.programme,
      r.studyCentre, r.state, r.session, r.contactPublic, r.isArchived, r.level,
    ]),
  ]);

  await logAudit({ userId: user.id, action: "export", entity: "representative", details: { rows: rows.length } });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("\uFEFF" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="noun-representatives-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
