import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { representatives } from "@/db/schema";
import { requireRole, isAdmin } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { PageHeading } from "@/components/ui";
import RepresentativeForm, { type RepresentativeDefaults } from "@/components/representative-form";
import ConfirmForm from "@/components/confirm-form";
import { buttonDanger } from "@/components/ui";
import { deleteRepresentative, updateRepresentative } from "../../actions";

export const dynamic = "force-dynamic";

const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export default async function EditRepresentativePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["admin", "editor"]);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [rep] = await db.select().from(representatives).where(eq(representatives.id, id)).limit(1);
  if (!rep) notFound();

  const lookups = await getLookups();
  const defaults: RepresentativeDefaults = {
    name: rep.name,
    email: s(rep.email),
    phone: s(rep.phone),
    bio: s(rep.bio),
    imageUrl: s(rep.imageUrl),
    positionId: s(rep.positionId),
    facultyId: s(rep.facultyId),
    departmentId: s(rep.departmentId),
    programmeId: s(rep.programmeId),
    studyCentreId: s(rep.studyCentreId),
    academicSessionId: s(rep.academicSessionId),
    stateId: s(rep.stateId),
    contactPublic: rep.contactPublic ? "on" : "",
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow={rep.isArchived ? "Archived record" : "Representatives"}
        title={`Edit ${rep.name}`}
        description="Changes are visible on the public directory immediately and recorded in the audit log."
      />
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8">
        <RepresentativeForm
          action={updateRepresentative}
          lookups={lookups}
          defaults={defaults}
          id={rep.id}
          submitLabel="Save changes"
        />
      </div>

      {isAdmin(user.role) && (
        <section aria-labelledby="danger" className="rounded-[var(--radius-card)] border border-red-200 bg-white p-5 sm:p-6">
          <h2 id="danger" className="text-base font-semibold text-accent">Delete record</h2>
          <p className="mt-1 text-sm text-muted">
            Deleting removes this representative permanently. To hide them without losing history, archive them from the list instead.
          </p>
          <ConfirmForm
            action={deleteRepresentative}
            message={`Permanently delete ${rep.name}? This cannot be undone.`}
            className="mt-4"
          >
            <input type="hidden" name="id" value={rep.id} />
            <button type="submit" className={buttonDanger}>Delete permanently</button>
          </ConfirmForm>
        </section>
      )}
    </div>
  );
}
