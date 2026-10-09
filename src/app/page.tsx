import Link from "next/link";
import { ArrowRight, ChevronRight, Search } from "lucide-react";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import SiteLayout from "@/components/site-layout";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, representatives } from "@/db/schema";
import { getInstitution } from "@/lib/institution";
import { Chip, ChipRow, EmptyState, Initials, SectionHeading, buttonSecondary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const inst = await getInstitution();

  const [[activeCount], [facultyCount], facultyRows, sessionRows, recent] = await Promise.all([
    db.select({ value: count() }).from(representatives).where(eq(representatives.isArchived, false)),
    db.select({ value: count() }).from(faculties),
    db
      .select({
        id: faculties.id,
        name: faculties.name,
        code: faculties.code,
        total: sql<number>`count(${representatives.id})::int`,
      })
      .from(faculties)
      .leftJoin(representatives, and(eq(representatives.facultyId, faculties.id), eq(representatives.isArchived, false)))
      .groupBy(faculties.id)
      .orderBy(asc(faculties.name)),
    db.select().from(academicSessions).orderBy(desc(academicSessions.startYear)).limit(6),
    db
      .select({
        id: representatives.id,
        name: representatives.name,
        positionName: positions.name,
        departmentName: departments.name,
        facultyName: faculties.name,
        sessionName: academicSessions.name,
      })
      .from(representatives)
      .leftJoin(positions, eq(representatives.positionId, positions.id))
      .leftJoin(departments, eq(representatives.departmentId, departments.id))
      .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
      .leftJoin(academicSessions, eq(representatives.academicSessionId, academicSessions.id))
      .where(eq(representatives.isArchived, false))
      .orderBy(desc(representatives.createdAt))
      .limit(8),
  ]);

  return (
    <SiteLayout>
      {/* Search-first panel */}
      <section className="border-b border-brand-ink/20 bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{inst.directoryTitle}</p>
          <h1 className="mt-3 max-w-2xl text-[28px] font-bold leading-[1.15] sm:text-4xl lg:text-[44px]">
            Find the student representative who speaks for you
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/85">
            Search by name, or filter by faculty, department, programme and study centre.
          </p>

          <form action="/directory" method="GET" role="search" className="mt-6 lg:max-w-2xl">
            <label htmlFor="q" className="sr-only">Search representatives</label>
            <div className="relative">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Name or email"
                autoComplete="off"
                className="h-[52px] w-full rounded-[var(--radius-card)] border-0 bg-white pl-11 pr-[124px] text-base text-ink shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 h-[40px] -translate-y-1/2 rounded-[10px] bg-brand-ink px-4 text-sm font-bold text-white hover:bg-black/60">
                Search
              </button>
            </div>
          </form>

          <dl className="mt-7 flex gap-8 border-t border-white/20 pt-5">
            <Metric label="Representatives" value={activeCount.value} />
            <Metric label="Faculties" value={facultyCount.value} />
          </dl>
        </div>
      </section>

      {/* Faculty shortcuts: a swipeable row on mobile, a grid from sm up */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12" aria-labelledby="faculty-heading">
        <SectionHeading
          title="Browse by faculty"
          action={
            <Link href="/directory" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
              All <ChevronRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <p id="faculty-heading" className="sr-only">Faculties</p>
        {facultyRows.length === 0 ? (
          <EmptyState text="No faculties have been added yet." />
        ) : (
          <>
            <div className="mt-4 sm:hidden">
              <ChipRow>
                {facultyRows.map((f) => (
                  <Chip key={f.id} href={`/directory?faculty=${f.id}`} count={f.total}>
                    {f.name.replace(/^Faculty of\s+/i, "")}
                  </Chip>
                ))}
              </ChipRow>
            </div>
            <ul className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {facultyRows.map((f) => (
                <li key={f.id}>
                  <Link href={`/directory?faculty=${f.id}`} className="group flex h-full items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4 transition-colors hover:border-brand hover:bg-brand-soft">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-ink">{f.name}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{f.code}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-tint px-2.5 py-1 text-xs font-bold tabular-nums text-muted group-hover:bg-white">{f.total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Recently added */}
      <section className="border-t border-line bg-white" aria-labelledby="recent-heading">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <SectionHeading
            title="Recently added"
            action={
              <Link href="/directory" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                Browse all <ChevronRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState text="No representatives have been published yet." />
          ) : (
            <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 lg:grid-cols-2 lg:gap-3">
              {recent.map((rep) => (
                <li key={rep.id}>
                  <Link
                    href={`/directory/${rep.id}`}
                    className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-white p-3.5 transition-colors hover:border-brand hover:bg-brand-soft sm:p-4"
                  >
                    <Initials name={rep.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-ink">{rep.name}</span>
                      <span className="block truncate text-sm text-brand">{rep.positionName ?? "Student representative"}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {[rep.departmentName ?? rep.facultyName, rep.sessionName].filter(Boolean).join(" · ") || "Awaiting assignment"}
                      </span>
                    </span>
                    <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-line-strong" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Sessions */}
      <section className="border-t border-line" aria-labelledby="sessions-heading">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <SectionHeading title="Academic sessions" action={<Link href="/directory#sessions" className={buttonSecondary}>View directory</Link>} />
          <p id="sessions-heading" className="mt-2 max-w-xl text-sm text-muted">
            Switch session to see who represented students then, including records that are no longer current.
          </p>
          {sessionRows.length === 0 ? (
            <EmptyState text="No academic sessions have been configured." />
          ) : (
            <div className="mt-4 sm:hidden">
              <ChipRow>
                {sessionRows.map((s) => (
                  <Chip key={s.id} href={`/directory?session=${s.id}`}>
                    {s.name}
                    {s.isActive && <span className="ml-1 text-[10px] font-bold text-accent">NOW</span>}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          )}
          <ul className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {sessionRows.map((s) => (
              <li key={s.id}>
                <Link href={`/directory?session=${s.id}`} className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-white p-4 hover:border-brand hover:bg-brand-soft">
                  <span>
                    <span className="block text-sm font-bold text-ink">{s.name}</span>
                    <span className="text-xs text-muted">{s.isActive ? "Current session" : "Historical"}</span>
                  </span>
                  {s.isActive && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Now</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/65">{label}</dt>
      <dd className="mt-0.5 text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
