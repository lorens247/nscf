import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Archive, ArchiveRestore, Eye, Pencil, Plus, Search } from "lucide-react";
import { db } from "@/db";
import { departments, faculties, positions, representatives } from "@/db/schema";
import { canWrite, isAdmin, requireRole } from "@/lib/auth-guard";
import { Notice, PageHeading, buttonPrimary, buttonSecondary, inputClass, EmptyState, RepresentativeAvatar } from "@/components/ui";
import { setArchived } from "./actions";
import DeleteRepresentativeButton from "./delete-button";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminRepresentatives({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole(["admin", "editor", "viewer"]);
  const sp = await searchParams;

  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = sp.status === "archived" || sp.status === "all" ? sp.status : "active";
  const page = Math.max(1, Number(sp.page) || 1);
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);

  const conditions: (SQL | undefined)[] = [
    status === "active" ? eq(representatives.isArchived, false) : status === "archived" ? eq(representatives.isArchived, true) : undefined,
    q ? or(ilike(representatives.name, `%${escaped}%`), ilike(representatives.email, `%${escaped}%`)) : undefined,
  ];
  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(representatives).where(where);
  const total = countRow?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(page, pageCount);

  const rows = await db
    .select({
      id: representatives.id,
      name: representatives.name,
      imageUrl: representatives.imageUrl,
      email: representatives.email,
      isArchived: representatives.isArchived,
      contactPublic: representatives.contactPublic,
      positionName: positions.name,
      facultyName: faculties.name,
      departmentName: departments.name,
    })
    .from(representatives)
    .leftJoin(positions, eq(representatives.positionId, positions.id))
    .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
    .leftJoin(departments, eq(representatives.departmentId, departments.id))
    .where(where)
    .orderBy(desc(representatives.updatedAt))
    .limit(PER_PAGE)
    .offset((current - 1) * PER_PAGE);

  const editable = canWrite(user.role);
  const linkFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status !== "active") next.set("status", status);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/representatives?${qs}` : "/admin/representatives";
  };

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Records"
        title="Representatives"
        actions={
          <>
            <Link href="/directory" className={buttonSecondary}>Public view</Link>
            {editable && <Link href="/admin/invitations" className={buttonSecondary}>Generate rep code</Link>}
            {editable && (
              <Link href="/admin/representatives/new" className={buttonPrimary}>
                <Plus size={16} aria-hidden="true" /> Add
              </Link>
            )}
          </>
        }
      />

      {sp.saved === "created" && <Notice tone="success">Representative created.</Notice>}
      {sp.saved === "updated" && <Notice tone="success">Changes saved.</Notice>}
      {sp.saved === "deleted" && <Notice tone="success">Representative deleted.</Notice>}

      <form method="GET" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="q" className="sr-only">Search by name or email</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Search name or email" className={`${inputClass} mt-0 h-12 pl-10`} />
        </div>
        <div className="flex gap-2">
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={status} className={`${inputClass} mt-0 h-12 flex-1 sm:w-36 sm:flex-none`}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
          <button type="submit" className={buttonSecondary}>Filter</button>
        </div>
      </form>

      <p className="text-sm text-muted">
        <span className="font-bold text-ink tabular-nums">{total}</span> {status === "all" ? "records" : status === "archived" ? "archived records" : "active records"}
        {q && <> matching “{q}”</>}
      </p>

      {rows.length === 0 ? (
        <EmptyState text="Nothing matches these filters.">{editable && <Link href="/admin/representatives/new" className={buttonPrimary}>Add a representative</Link>}</EmptyState>
      ) : (
        <>
          {/* One list at every screen width keeps records and actions visible. */}
          <ul aria-label="Representatives" className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-white p-4">
                <div className="flex items-start gap-3">
                  <RepresentativeAvatar name={r.name} imageUrl={r.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-bold text-ink">{r.name}</p>
                      <StatusPill archived={r.isArchived} />
                    </div>
                    <p className="truncate text-sm font-semibold text-brand">{r.positionName ?? "No position"}</p>
                    <p className="mt-1 truncate text-xs text-muted">{[r.facultyName, r.departmentName].filter(Boolean).join(" · ") || "Unassigned"}</p>
                    <p className="mt-1 truncate text-xs text-muted">{r.email ?? "No email"} · {r.contactPublic ? "contact public" : "contact private"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 sm:justify-end">
                  <Link href={`/admin/representatives/${r.id}`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-field)] border border-line-strong px-3 text-sm font-bold text-ink sm:flex-none">
                    <Eye size={15} aria-hidden="true" /> View
                  </Link>
                  {editable && (
                    <Link href={`/admin/representatives/${r.id}/edit`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-field)] bg-brand px-3 text-sm font-bold text-white sm:flex-none">
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </Link>
                  )}
                  {editable && <ArchiveButton id={r.id} archived={r.isArchived} />}
                  {isAdmin(user.role) && <DeleteRepresentativeButton id={r.id} name={r.name} />}
                </div>
              </li>
            ))}
          </ul>


        </>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line pt-4">
          {current > 1 ? <Link href={linkFor(current - 1)} className={buttonSecondary}>Previous</Link> : <span />}
          <span className="text-sm font-semibold tabular-nums text-muted">Page {current} of {pageCount}</span>
          {current < pageCount ? <Link href={linkFor(current + 1)} className={buttonSecondary}>Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}

function StatusPill({ archived }: { archived: boolean }) {
  return archived ? (
    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">Archived</span>
  ) : (
    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">Active</span>
  );
}

function ArchiveButton({ id, archived, iconOnly, name }: { id: number; archived: boolean; iconOnly?: boolean; name?: string }) {
  const label = archived ? "Restore" : "Archive";
  const Icon = archived ? ArchiveRestore : Archive;
  return (
    <form action={setArchived} className="contents">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="archive" value={archived ? "0" : "1"} />
      <button
        type="submit"
        aria-label={iconOnly ? `${label} ${name ?? "record"}` : undefined}
        className={
          iconOnly
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-field)] border border-line-strong text-muted hover:bg-tint hover:text-ink"
            : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-field)] border border-line-strong text-muted hover:text-ink sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm sm:font-bold"
        }
      >
        <Icon size={16} aria-hidden="true" />
        {!iconOnly && <span className="hidden sm:inline">{label}</span>}
      </button>
    </form>
  );
}
