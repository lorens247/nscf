import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, representatives, states, studyCentres } from "@/db/schema";
import { requireRole, isAdmin, canWrite } from "@/lib/auth-guard";
import { PageHeading, Notice, buttonPrimary, buttonDanger, buttonSecondary } from "@/components/ui";
import ConfirmForm from "@/components/confirm-form";
import CatalogFields from "@/components/catalog-fields";
import { createCatalogItem, deleteCatalogItem } from "./actions";
import { CATALOG_KINDS, type CatalogKind } from "@/lib/validators";
import { getLookups } from "@/lib/lookups";

export const dynamic = "force-dynamic";

const TABS: Record<CatalogKind, string> = {
  faculty: "Faculties",
  department: "Departments",
  programme: "Programmes",
  centre: "Study centres",
  session: "Academic sessions",
  position: "Positions",
  state: "States",
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole(["admin", "editor"]);
  const sp = await searchParams;
  const tab: CatalogKind = (CATALOG_KINDS as string[]).includes(sp.tab ?? "") ? (sp.tab as CatalogKind) : "faculty";
  const lookups = await getLookups();
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Catalog"
        title="Faculties, programmes and more"
        description="These lists feed the filters and forms across the directory. Items in use cannot be deleted."
      />

      {sp.saved === "created" && <Notice tone="success">Catalog item created.</Notice>}
      {sp.saved === "updated" && <Notice tone="success">Catalog item updated.</Notice>}
      {sp.saved === "deleted" && <Notice tone="success">Catalog item deleted.</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <nav aria-label="Catalog sections" className="-mx-4 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-1">
          {CATALOG_KINDS.map((k) => (
            <li key={k}>
              <Link
                href={`/admin/catalog?tab=${k}`}
                aria-current={tab === k ? "page" : undefined}
                className={`-mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${
                  tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {TABS[k]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <CatalogSection kind={tab} writable={writable} isAdmin={isAdmin(user.role)} lookups={lookups} />
    </div>
  );
}

type Lookups = Awaited<ReturnType<typeof getLookups>>;

async function loadItems(kind: CatalogKind) {
  switch (kind) {
    case "faculty":
      return db
        .select({ id: faculties.id, name: faculties.name, code: faculties.code, parent: sql<string | null>`null`, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.facultyId} = ${faculties.id})` })
        .from(faculties)
        .orderBy(asc(faculties.name));
    case "department":
      return db
        .select({ id: departments.id, name: departments.name, code: departments.code, parent: faculties.name, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.departmentId} = ${departments.id})` })
        .from(departments)
        .leftJoin(faculties, eq(departments.facultyId, faculties.id))
        .orderBy(asc(departments.name));
    case "programme":
      return db
        .select({ id: programmes.id, name: programmes.name, code: programmes.code, parent: departments.name, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.programmeId} = ${programmes.id})` })
        .from(programmes)
        .leftJoin(departments, eq(programmes.departmentId, departments.id))
        .orderBy(asc(programmes.name));
    case "centre":
      return db
        .select({ id: studyCentres.id, name: studyCentres.name, code: studyCentres.location, parent: states.name, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.studyCentreId} = ${studyCentres.id})` })
        .from(studyCentres)
        .leftJoin(states, eq(studyCentres.stateId, states.id))
        .orderBy(asc(studyCentres.name));
    case "session":
      return db
        .select({ id: academicSessions.id, name: academicSessions.name, code: sql<string>`${academicSessions.startYear}::text || '–' || ${academicSessions.endYear}::text`, parent: sql<string | null>`case when ${academicSessions.isActive} then 'Current session' else null end`, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.academicSessionId} = ${academicSessions.id})` })
        .from(academicSessions)
        .orderBy(sql`${academicSessions.startYear} desc`);
    case "position":
      return db
        .select({ id: positions.id, name: positions.name, code: positions.category, parent: sql<string | null>`null`, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.positionId} = ${positions.id})` })
        .from(positions)
        .orderBy(asc(positions.name));
    case "state":
      return db
        .select({ id: states.id, name: states.name, code: states.code, parent: sql<string | null>`null`, inUse: sql<number>`(select count(*)::int from ${representatives} where ${representatives.stateId} = ${states.id})` })
        .from(states)
        .orderBy(asc(states.name));
  }
}

async function CatalogSection({ kind, writable, isAdmin: admin, lookups }: { kind: CatalogKind; writable: boolean; isAdmin: boolean; lookups: Lookups }) {
  const items = await loadItems(kind);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {writable && (
        <section aria-labelledby="add-heading" className="rounded-[var(--radius-card)] border border-line bg-white p-5 lg:col-span-1 lg:self-start">
          <h2 id="add-heading" className="text-base font-semibold text-ink">Add {TABS[kind].toLowerCase().replace(/ies$/, "y").replace(/s$/, "")}</h2>
          <form action={createCatalogItem} className="mt-4 space-y-4">
            <input type="hidden" name="kind" value={kind} />
            <CatalogFields kind={kind} lookups={lookups} prefix={`create-${kind}`} />
            <button type="submit" className={`${buttonPrimary} w-full`}>Save</button>
          </form>
        </section>
      )}

      <section aria-labelledby="list-heading" className={`rounded-[var(--radius-card)] border border-line bg-white ${writable ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="list-heading" className="text-base font-semibold text-ink">{TABS[kind]}</h2>
          <span className="text-sm text-muted">{items.length} total</span>
        </div>
        {items.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nothing added yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {[item.code, item.parent].filter(Boolean).join(" · ") || "—"}
                    <span className="text-slate-400"> · {item.inUse} in use</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/catalog/${kind}/${item.id}/edit`} className={`${buttonSecondary} min-h-10 px-4`}>Edit</Link>
                  {admin && item.inUse === 0 && (
                    <ConfirmForm action={deleteCatalogItem} message={`Delete “${item.name}”? This cannot be undone.`}>
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className={`${buttonDanger} min-h-10 px-4`}>Delete</button>
                    </ConfirmForm>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
