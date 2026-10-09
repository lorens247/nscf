import { requireRole } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { PageHeading } from "@/components/ui";
import RepresentativeForm from "@/components/representative-form";
import { createRepresentative } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewRepresentativePage() {
  await requireRole(["admin", "editor"]);
  const lookups = await getLookups();

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="Representatives" title="Add a representative" description="Required fields are marked with an asterisk. Contact details are public by default." />
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8">
        <RepresentativeForm
          action={createRepresentative}
          lookups={lookups}
          defaults={{ contactPublic: "on" }}
          submitLabel="Create representative"
        />
      </div>
    </div>
  );
}
