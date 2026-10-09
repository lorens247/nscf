import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, auditLogs, faculties, representatives, users } from "@/db/schema";
import { requireRole, canWrite } from "@/lib/auth-guard";
import { PageHeading, Notice, buttonPrimary, Card } from "@/components/ui";
import InvitationGenerator from "@/components/invitation-generator";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole(["admin", "editor", "viewer"]);
  const sp = await searchParams;

  const [[active], [archived], [facultyCount], [sessionCount], recent] = await Promise.all([
    db.select({ value: count() }).from(representatives).where(eq(representatives.isArchived, false)),
    db.select({ value: count() }).from(representatives).where(eq(representatives.isArchived, true)),
    db.select({ value: count() }).from(faculties),
    db.select({ value: count() }).from(academicSessions),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
        actor: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  const stats = [
    { label: "Active", value: active.value, href: "/admin/representatives" },
    { label: "Archived", value: archived.value, href: "/admin/representatives?status=archived" },
    { label: "Faculties", value: facultyCount.value, href: "/admin/catalog?tab=faculty" },
    { label: "Sessions", value: sessionCount.value, href: "/admin/catalog?tab=session" },
  ];

  const tasks = canWrite(user.role)
    ? [
        { label: "Add a representative", href: "/admin/representatives/new" },
        { label: "Generate rep access codes", href: "/admin/invitations" },
        { label: "Import from CSV", href: "/admin/import" },
        { label: "Manage the catalog", href: "/admin/catalog" },
        { label: "Export all records", href: "/api/export" },
      ]
    : [
        { label: "Browse representatives", href: "/admin/representatives" },
        { label: "Export all records", href: "/api/export" },
      ];

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Overview"
        title={user.name || user.email}
        description="Keep representative records accurate. Every change is written to the audit log."
        actions={
          canWrite(user.role) && (
            <Link href="/admin/representatives/new" className={buttonPrimary}>
              Add representative
            </Link>
          )
        }
      />

      {sp.forbidden && <Notice tone="error">Your role does not have access to that page.</Notice>}

      {canWrite(user.role) && (
        <section aria-labelledby="rep-access-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="rep-access-heading" className="text-lg font-bold text-ink">Rep access code generator</h2>
            <Link href="/admin/invitations" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">Manage codes</Link>
          </div>
          <p className="text-sm text-muted">Generate a single-use code and share it with a representative so they can add their details and photo. Each code expires after seven days.</p>
          <InvitationGenerator />
        </section>
      )}

      <dl className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-card)] border border-line bg-white p-4 sm:p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</dt>
            <dd className="mt-1.5 text-3xl font-bold tabular-nums text-ink">{s.value}</dd>
            <Link href={s.href} className="mt-2 inline-block text-sm font-bold text-brand hover:underline">View</Link>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Recent activity</h2>
            {user.role === "admin" && <Link href="/admin/audit" className="text-sm font-bold text-brand hover:underline">Full log</Link>}
          </div>
          {recent.length === 0 ? (
            <p className="p-5 text-sm text-muted">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
                  <span className="min-w-0 truncate text-sm text-ink">
                    <span className="font-bold capitalize">{r.action}</span>{" "}
                    <span className="text-muted">{r.entity}{r.entityId ? ` #${r.entityId}` : ""}</span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] leading-tight text-muted">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    <span className="block truncate">{r.actor ?? "System"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Tasks</h2>
          </div>
          <ul className="p-2">
            {tasks.map((t) => (
              <li key={t.href + t.label}>
                <Link href={t.href} className="flex min-h-11 items-center justify-between rounded-[var(--radius-field)] px-3 text-sm font-semibold text-ink hover:bg-brand-soft hover:text-brand">
                  {t.label}
                  <span aria-hidden="true" className="text-line-strong">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
