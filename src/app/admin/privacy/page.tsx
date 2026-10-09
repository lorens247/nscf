import { requireRole } from "@/lib/auth-guard";
import { getPrivacy, PRIVACY_KEYS } from "@/lib/privacy";
import { PageHeading, Notice, buttonPrimary } from "@/components/ui";
import { updatePrivacy } from "./actions";

export const dynamic = "force-dynamic";

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const privacy = await getPrivacy();
  const current: Record<string, boolean> = { emailPublic: privacy.emailPublic, phonePublic: privacy.phonePublic, showEmailInDirectory: privacy.showEmailInDirectory };

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Compliance"
        title="Privacy controls"
        description="Site-wide switches that override individual records. A representative can always be more private than these settings, never less."
      />

      {sp.saved && <Notice tone="success">Privacy settings updated and published.</Notice>}

      <form action={updatePrivacy} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        <ul className="divide-y divide-line">
          {PRIVACY_KEYS.map((entry) => (
            <li key={entry.key}>
              <label className="flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-tint">
                <input
                  type="checkbox"
                  name="enabled"
                  value={entry.key}
                  defaultChecked={current[entry.key]}
                  className="mt-0.5 h-6 w-6 shrink-0 rounded accent-brand"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{entry.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{entry.help}</span>
                  <span className="mt-2 inline-block rounded bg-tint px-2 py-0.5 font-mono text-[11px] text-muted">{entry.column}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t border-line bg-tint px-5 py-4">
          <button type="submit" className={buttonPrimary}>Save privacy settings</button>
        </div>
      </form>

      <p className="text-xs leading-relaxed text-muted">
        Changes take effect on the public directory immediately and are recorded in the audit log.
      </p>
    </div>
  );
}
