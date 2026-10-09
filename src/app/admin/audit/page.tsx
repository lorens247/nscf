import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

const LIMIT = 200;

export default async function AuditPage() {
  await requireRole(["admin"]);

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(LIMIT);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Compliance"
        title="Audit log"
        description={`The most recent ${LIMIT} changes made in the administration area. Entries cannot be edited from the interface.`}
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {logs.map((l) => (
                <li key={l.id} className="space-y-1 px-4 py-3 text-sm">
                  <p className="font-semibold capitalize text-ink">{l.action} <span className="font-normal text-muted">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</span></p>
                  <p className="text-xs text-muted">{l.actorEmail ?? "System"} · {l.createdAt ? new Date(l.createdAt).toLocaleString("en-NG") : ""}</p>
                  {l.details && <p className="truncate font-mono text-xs text-muted">{JSON.stringify(l.details)}</p>}
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-tint text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">When</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Record</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((l) => (
                    <tr key={l.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{l.createdAt ? new Date(l.createdAt).toLocaleString("en-NG") : "—"}</td>
                      <td className="px-4 py-3 text-ink">{l.actorEmail ?? "System"}</td>
                      <td className="px-4 py-3 font-medium capitalize text-ink">{l.action}</td>
                      <td className="px-4 py-3 text-muted">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted">{l.details ? JSON.stringify(l.details) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
