import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, states, studyCentres } from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { CATALOG_KINDS, type CatalogKind } from "@/lib/validators";
import { getLookups } from "@/lib/lookups";
import CatalogFields from "@/components/catalog-fields";
import { Notice, PageHeading, buttonPrimary, buttonSecondary } from "@/components/ui";
import { updateCatalogItem } from "../../../actions";

export const dynamic = "force-dynamic";

const LABELS: Record<CatalogKind, string> = {
  faculty: "faculty",
  department: "department",
  programme: "programme",
  centre: "study centre",
  session: "academic session",
  position: "position",
  state: "state",
};

type Defaults = Record<string, string | number | boolean | null | undefined>;

async function loadItem(kind: CatalogKind, id: number): Promise<{ name: string; defaults: Defaults } | null> {
  switch (kind) {
    case "faculty": {
      const [row] = await db.select().from(faculties).where(eq(faculties.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, code: row.code } } : null;
    }
    case "department": {
      const [row] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, code: row.code, facultyId: row.facultyId } } : null;
    }
    case "programme": {
      const [row] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, code: row.code, departmentId: row.departmentId } } : null;
    }
    case "centre": {
      const [row] = await db.select().from(studyCentres).where(eq(studyCentres.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, location: row.location, stateId: row.stateId } } : null;
    }
    case "session": {
      const [row] = await db.select().from(academicSessions).where(eq(academicSessions.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, startYear: row.startYear, endYear: row.endYear, isActive: row.isActive } } : null;
    }
    case "position": {
      const [row] = await db.select().from(positions).where(eq(positions.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, category: row.category } } : null;
    }
    case "state": {
      const [row] = await db.select().from(states).where(eq(states.id, id)).limit(1);
      return row ? { name: row.name, defaults: { name: row.name, code: row.code } } : null;
    }
  }
}

export default async function EditCatalogItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole(["admin", "editor"]);
  const raw = await params;
  if (!(CATALOG_KINDS as readonly string[]).includes(raw.kind)) notFound();
  const kind = raw.kind as CatalogKind;
  const id = Number(raw.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [item, lookups, sp] = await Promise.all([loadItem(kind, id), getLookups(), searchParams]);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Catalog"
        title={`Edit ${LABELS[kind]}`}
        description={`Update “${item.name}”. Changes immediately affect public filters and profiles.`}
        actions={<Link href={`/admin/catalog?tab=${kind}`} className={buttonSecondary}>Back to catalog</Link>}
      />

      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <form action={updateCatalogItem} className="space-y-5 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:max-w-xl sm:p-6">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <CatalogFields kind={kind} lookups={lookups} defaults={item.defaults} prefix={`edit-${kind}`} />
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Link href={`/admin/catalog?tab=${kind}`} className={buttonSecondary}>Cancel</Link>
          <button type="submit" className={buttonPrimary}>Save changes</button>
        </div>
      </form>
    </div>
  );
}
