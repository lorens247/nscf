import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { representativeInvites, representatives } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { getInstitution } from "@/lib/institution";
import InvitationGenerator from "@/components/invitation-generator";
import { EmptyState, PageHeading, buttonSecondary } from "@/components/ui";
import { revokeInvitation } from "./actions";

export const dynamic = "force-dynamic";
export default async function InvitationsPage() {
  await requireRole(["admin", "editor"]);
  const inst = await getInstitution();
  const rows = await db.select({ id: representativeInvites.id, expiresAt: representativeInvites.expiresAt, usedAt: representativeInvites.usedAt, name: representatives.name })
    .from(representativeInvites).leftJoin(representatives, eq(representativeInvites.representativeId, representatives.id))
    .where(eq(representativeInvites.institutionId, inst.id)).orderBy(desc(representativeInvites.id)).limit(50);
  return <div className="space-y-6">
    <PageHeading title="Representative access codes" description="Generate one code per representative. Codes expire after seven days and can publish one profile with a photo. Revoke any unused code if it should no longer be shared." />
    <InvitationGenerator />
    <h2 className="text-lg font-bold text-ink">Latest 50 codes</h2>
    {rows.length === 0 ? <EmptyState text="No access codes have been created yet." /> : <ul className="space-y-3">
      {rows.map((invite) => {
        const available = !invite.usedAt && invite.expiresAt > new Date();
        return <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4">
          <div><p className="text-sm font-semibold text-ink">Code #{invite.id} · {invite.usedAt ? `Used${invite.name ? ` by ${invite.name}` : ""}` : available ? "Available" : "Expired / revoked"}</p>
            <p className="mt-1 text-xs text-muted">Expires {invite.expiresAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (Lagos time)</p></div>
          {available && <form action={revokeInvitation}><input type="hidden" name="id" value={invite.id} /><button className={buttonSecondary}>Revoke</button></form>}
        </li>;
      })}
    </ul>}
  </div>;
}
