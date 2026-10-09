import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import SiteLayout from "@/components/site-layout";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, representatives, states, studyCentres } from "@/db/schema";
import { getLookups } from "@/lib/lookups";
import { getPrivacy } from "@/lib/privacy";
import { Chip, ChipRow, EmptyState, Initials } from "@/components/ui";
import DirectoryFilterControls from "@/components/directory-filter-controls";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

const SORTS = {
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  newest: "Recently added",
  session: "Latest session",
} as const;
type SortKey = keyof typeof SORTS;

const str = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();
const toId = (v: string | string[] | undefined) => {
  const n = Number(str(v));
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

type Params = Record<string, string | number | undefined>;

function hrefFor(params: Params) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `/directory?${qs}` : "/directory";
}

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const lookups = await getLookups();
  const privacy = await getPrivacy();

  const q = str(sp.q).slice(0, 100);
  const sortParam = str(sp.sort) as SortKey;
  const sort: SortKey = sortParam in SORTS ? sortParam : "name_asc";
  const filters = {
    session: toId(sp.session),
    faculty: toId(sp.faculty),
    dept: toId(sp.dept),
    centre: toId(sp.centre),
    state: toId(sp.state),
    position: toId(sp.position),
  };
  const requestedPage = Math.max(1, Number(str(sp.page)) || 1);

  // LIKE wildcards in user input are escaped so they match literally.
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const conditions: (SQL | undefined)[] = [
    eq(representatives.isArchived, false),
    q ? or(ilike(representatives.name, `%${escaped}%`), ilike(representatives.email, `%${escaped}%`)) : undefined,
    filters.session ? eq(representatives.academicSessionId, filters.session) : undefined,
    filters.faculty ? eq(representatives.facultyId, filters.faculty) : undefined,
    filters.dept ? eq(representatives.departmentId, filters.dept) : undefined,
    filters.centre ? eq(representatives.studyCentreId, filters.centre) : undefined,
    filters.state ? eq(representatives.stateId, filters.state) : undefined,
    filters.position ? eq(representatives.positionId, filters.position) : undefined,
  ];
  const where = and(...conditions);

  const orderBy: SQL[] =
    sort === "name_desc"
      ? [desc(representatives.name)]
      : sort === "newest"
        ? [desc(representatives.createdAt)]
        : sort === "session"
          ? [desc(academicSessions.startYear), asc(representatives.name)]
          : [asc(representatives.name)];

  const [countRow] = await db.select({ value: count() }).from(representatives).where(where);
  const total = countRow?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(requestedPage, pageCount);

  const rows = await db
    .select({
      id: representatives.id,
      name: representatives.name,
      email: representatives.email,
      positionName: positions.name,
      facultyName: faculties.name,
      departmentName: departments.name,
      centreName: studyCentres.name,
      stateName: states.name,
      sessionName: academicSessions.name,
      contactPublic: representatives.contactPublic,
    })
    .from(representatives)
    .leftJoin(positions, eq(representatives.positionId, positions.id))
    .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
    .leftJoin(departments, eq(representatives.departmentId, departments.id))
    .leftJoin(studyCentres, eq(representatives.studyCentreId, studyCentres.id))
    .leftJoin(states, eq(representatives.stateId, states.id))
    .leftJoin(academicSessions, eq(representatives.academicSessionId, academicSessions.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  const current: Params = { q, sort, ...filters };
  const active = Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, number][];
  if (q) active.push(["q", 1] as [string, number]);
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  return (
    <SiteLayout>
      {/* Sticky search: the primary mobile entry point stays reachable while scrolling */}
      <div className="sticky top-[59px] z-30 border-b border-line bg-white/97 px-4 py-3 backdrop-blur sm:px-6 lg:top-16">
        <form method="GET" action="/directory" role="search" className="relative mx-auto max-w-3xl">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <label htmlFor="q" className="sr-only">Search by name or email</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search representatives"
            autoComplete="off"
            className="h-12 w-full rounded-[var(--radius-card)] border border-line-strong bg-white pl-11 pr-24 text-base text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button type="submit" className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-[10px] bg-brand px-4 text-sm font-bold text-white hover:bg-brand-hover">
            Search
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Student representatives</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {total === 0 ? "No matches" : <>Showing <span className="font-bold text-ink tabular-nums">{from}–{to}</span> of <span className="font-bold text-ink tabular-nums">{total}</span></>}
          </p>
        </div>

        {/* Session chips: swipeable on mobile */}
        <section id="sessions" aria-labelledby="sessions-label" className="mt-5 scroll-mt-32">
          <h2 id="sessions-label" className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Session</h2>
          <ChipRow>
            <Chip href={hrefFor({ ...current, session: undefined, page: undefined })} active={!filters.session}>All</Chip>
            {lookups.sessions.map((s) => (
              <Chip key={s.id} href={hrefFor({ ...current, session: s.id, page: undefined })} active={filters.session === s.id}>{s.name}</Chip>
            ))}
          </ChipRow>
        </section>

        <DirectoryFilterControls
          values={{ q, sort, ...filters }}
          lookups={lookups}
          activeCount={Object.values(filters).filter(Boolean).length}
        />

        {active.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
            {active.map(([key, value]) => {
              const label = key === "q" ? `“${q}”` : lookups[facetToLookup(key)]?.find((o) => o.id === value)?.name ?? value;
              return (
                <li key={key}>
                  <Link href={hrefFor({ ...current, [key]: undefined, page: undefined })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-3 text-xs font-bold text-brand hover:border-accent hover:bg-accent-soft hover:text-accent">
                    {String(label)}
                    <X size={13} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {rows.length === 0 ? (
          <EmptyState text="No representatives match these filters. Try removing one, or search a different spelling.">
            <Link href="/directory" className="inline-flex min-h-11 items-center rounded-[var(--radius-field)] border border-line-strong bg-white px-5 text-sm font-bold text-ink">Reset search</Link>
          </EmptyState>
        ) : (
          <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {rows.map((rep) => (
              <li key={rep.id}>
                <Link
                  href={`/directory/${rep.id}`}
                  className="flex h-full items-start gap-3.5 rounded-[var(--radius-card)] border border-line bg-white p-4 transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  <Initials name={rep.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{rep.name}</p>
                    <p className="truncate text-sm font-semibold text-brand">{rep.positionName ?? "Student representative"}</p>
                    <p className="mt-1.5 truncate text-xs text-muted">
                      {[rep.facultyName, rep.departmentName].filter(Boolean).join(" · ") || "Faculty not assigned"}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {rep.sessionName && <span className="rounded bg-tint px-1.5 py-0.5 font-semibold text-ink">{rep.sessionName}</span>}
                      {rep.centreName && <span className="truncate">{rep.centreName}</span>}
                      {privacy.showEmailInDirectory && rep.contactPublic && rep.email && <span className="truncate text-brand">{rep.email}</span>}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            <PagerLink href={hrefFor({ ...current, page: page - 1 })} disabled={page <= 1} side="prev">Previous</PagerLink>
            <span className="text-sm font-semibold tabular-nums text-muted">Page {page} / {pageCount}</span>
            <PagerLink href={hrefFor({ ...current, page: page + 1 })} disabled={page >= pageCount} side="next">Next</PagerLink>
          </nav>
        )}
      </div>
    </SiteLayout>
  );
}

const facetToLookup = (key: string) =>
  ({ faculty: "faculties", dept: "departments", position: "positions", centre: "studyCentres", state: "states", session: "sessions" } as const)[key as "faculty"] ?? "faculties";

function PagerLink({ href, disabled, side, children }: { href: string; disabled: boolean; side: "prev" | "next"; children: React.ReactNode }) {
  const cls = "inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-field)] border px-4 text-sm font-bold transition-colors";
  if (disabled) return <span aria-disabled="true" className={`${cls} border-line text-line-strong`}>{children}</span>;
  return (
    <Link href={href} className={`${cls} border-line-strong bg-white text-ink hover:border-brand hover:bg-brand-soft hover:text-brand`}>
      {side === "prev" && <ChevronLeft size={16} aria-hidden="true" />}
      {children}
      {side === "next" && <ChevronRight size={16} aria-hidden="true" />}
    </Link>
  );
}
