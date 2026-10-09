import Link from "next/link";
import type { InstitutionInfo } from "@/lib/institution";

export function SiteFooter({ inst }: { inst: InstitutionInfo }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-bold text-ink">{inst.name}</p>
            <p className="mt-1.5 text-sm italic text-brand">{inst.motto}</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted">
            <Link href="/directory" className="hover:text-brand">Directory</Link>
            <Link href="/sessions" className="hover:text-brand">Sessions</Link>
            <Link href="/admin" className="hover:text-brand">Admin sign in</Link>
          </nav>
        </div>
        <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
          © {new Date().getFullYear()} {inst.name}. Contact details are published only where a representative has chosen to share them.
        </p>
      </div>
    </footer>
  );
}
