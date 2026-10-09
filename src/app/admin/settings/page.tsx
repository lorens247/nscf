import { requireRole } from "@/lib/auth-guard";
import { getInstitution } from "@/lib/institution";
import { Logo } from "@/components/logo";
import { PageHeading, Notice, buttonPrimary, inputClass } from "@/components/ui";
import { updateInstitution } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const inst = await getInstitution();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Institution"
        title="Institution settings"
        description="Name, motto and logo shown across the public directory and admin area. The official crest should be uploaded here, never redrawn."
      />

      {sp.saved && <Notice tone="success">Settings saved.</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="logo-heading" className="rounded-[var(--radius-card)] border border-line bg-white p-5 lg:self-start">
          <h2 id="logo-heading" className="text-base font-semibold text-ink">Logo preview</h2>
          <div className="mt-4 flex h-32 items-center justify-center rounded-md border border-dashed border-line-strong bg-tint">
            <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} size="lg" />
          </div>
          <p className="mt-3 text-xs text-muted">
            {inst.logoUrl ? "Showing the logo from the URL below." : "No logo set. A text placeholder is shown until an official logo URL is added."}
          </p>
        </section>

        <form action={updateInstitution} className="space-y-5 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-6 lg:col-span-2">
          <Field id="name" label="Institution name" defaultValue={inst.name} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="shortName" label="Short name" defaultValue={inst.shortName} />
            <Field id="motto" label="Motto" defaultValue={inst.motto} />
          </div>
          <Field id="directoryTitle" label="Directory title" defaultValue={inst.directoryTitle} />
          <Field id="logoUrl" label="Logo URL" defaultValue={inst.logoUrl ?? ""} hint="Link to the official logo image (PNG or SVG), or a /path in the public folder." />
          <div className="flex justify-end border-t border-line pt-5">
            <button type="submit" className={buttonPrimary}>Save settings</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, defaultValue, hint }: { id: string; label: string; defaultValue: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      <input id={id} name={id} defaultValue={defaultValue} required={id !== "logoUrl" && id !== "motto"} className={inputClass} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
