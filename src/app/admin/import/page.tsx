import Link from "next/link";
import { Download } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { PageHeading, Notice, buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";
import { importRepresentatives } from "./actions";

export const dynamic = "force-dynamic";

const COLUMNS = [
  ["name", "Required. Full name"],
  ["email", "Public email, if permitted"],
  ["phone", "Phone number"],
  ["bio", "Short biography"],
  ["image_url", "Link to a photo"],
  ["position", "Must match a catalog position"],
  ["faculty", "Must match a catalog faculty"],
  ["department", "Must match a catalog department"],
  ["programme", "Must match a catalog programme"],
  ["study_centre", "Must match a catalog study centre"],
  ["state", "Must match a catalog state"],
  ["academic_session", "Must match a catalog session, e.g. 2025/2026"],
  ["level", "Optional: 100, 200, 300, 400, 500, 600, 700, or 800"],
  ["contact_public", "true or false (default true)"],
  ["is_archived", "true or false (default false)"],
] as const;

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin", "editor"]);
  const sp = await searchParams;
  const problems = sp.problems ? sp.problems.split(" | ") : [];

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Data"
        title="Import representatives"
        description="Upload a CSV file. Each row is validated; invalid rows are skipped and reported, and the rest are imported."
        actions={
          <Link href="/api/export" className={buttonSecondary}>
            <Download size={16} aria-hidden="true" /> Export current data
          </Link>
        }
      />

      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.imported !== undefined && (
        <Notice tone={Number(sp.skipped) > 0 ? "info" : "success"}>
          Imported {sp.imported} record(s).{Number(sp.skipped) > 0 ? ` Skipped ${sp.skipped} row(s).` : ""}
        </Notice>
      )}
      {problems.length > 0 && (
        <ul className="list-disc space-y-1 rounded-md border border-line bg-white p-4 pl-8 text-sm text-muted">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={importRepresentatives} encType="multipart/form-data" className="space-y-4 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6 lg:col-span-2">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-ink">CSV file</label>
            <input id="file" name="file" type="file" accept=".csv,text/csv" required className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand`} />
            <p className="mt-1 text-xs text-muted">Up to 2 MB and 2,000 rows. Save spreadsheets as “CSV UTF-8”.</p>
          </div>
          <button type="submit" className={buttonPrimary}>Upload and import</button>
        </form>

        <section aria-labelledby="columns" className="rounded-[var(--radius-card)] border border-line bg-tint p-5 lg:self-start">
          <h2 id="columns" className="text-base font-semibold text-ink">Expected columns</h2>
          <p className="mt-1 text-xs text-muted">Header names are case-insensitive. Spaces become underscores.</p>
          <dl className="mt-4 space-y-3 text-sm">
            {COLUMNS.map(([col, help]) => (
              <div key={col}>
                <dt className="font-mono text-xs font-semibold text-ink">{col}</dt>
                <dd className="text-xs text-muted">{help}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
