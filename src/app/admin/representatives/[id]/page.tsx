import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, representatives, states, studyCentres } from "@/db/schema";
import { canWrite, isAdmin, requireRole } from "@/lib/auth-guard";
import { PageHeading, RepresentativeAvatar, buttonPrimary, buttonSecondary } from "@/components/ui";
import DeleteRepresentativeButton from "../delete-button";

export const dynamic = "force-dynamic";

export default async function RepresentativeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["admin", "editor", "viewer"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [rep] = await db
    .select({
      record: representatives,
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
    .where(eq(representatives.id, id))
    .limit(1);
  if (!rep) notFound();

  const record = rep.record;
  const details: [string, string | null][] = [
    ["Email", record.email],
    ["Phone", record.phone],
    ["Position", rep.position],
    ["Faculty", rep.faculty],
    ["Department", rep.department],
    ["Programme", rep.programme],
    ["Level", record.level === null ? null : String(record.level)],
    ["Study centre", rep.studyCentre],
    ["State", rep.state],
    ["Academic session", rep.session],
    ["Status", record.isArchived ? "Archived" : "Active"],
    ["Contact visibility", record.contactPublic ? "Public" : "Private"],
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/representatives" className={buttonSecondary}>Back to representatives</Link>
      <PageHeading
        eyebrow={record.isArchived ? "Archived representative" : "Representative"}
        title={record.name}
        actions={<>
          {canWrite(user.role) && <Link href={`/admin/representatives/${id}/edit`} className={buttonPrimary}>Edit representative</Link>}
          {isAdmin(user.role) && <DeleteRepresentativeButton id={id} name={record.name} />}
        </>}
      />
      <section aria-label="Representative details" className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line p-5">
          <RepresentativeAvatar name={record.name} imageUrl={record.imageUrl} />
          <p className="font-semibold text-ink">{record.name}</p>
        </div>
        <dl className="divide-y divide-line">
          {details.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="min-w-0 break-words text-sm font-semibold text-ink">{value || "Not set"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="bio" className="rounded-[var(--radius-card)] border border-line bg-white p-5">
        <h2 id="bio" className="font-semibold text-ink">Biography</h2>
        <p className="mt-2 whitespace-pre-line break-words text-sm text-muted">{record.bio || "No biography provided."}</p>
      </section>
    </div>
  );
}
