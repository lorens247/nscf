import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Search, UserPlus } from "lucide-react";
import type { InstitutionInfo } from "@/lib/institution";
import { Logo } from "@/components/logo";

const DIRECTORY_LINKS = [
  { href: "/", label: "Directory overview" },
  { href: "/directory", label: "Find a representative" },
  { href: "/sessions", label: "Academic sessions" },
];

export function SiteFooter({ inst }: { inst: InstitutionInfo }) {
  return (
    <footer className="border-t border-brand-line bg-white pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Your student community</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Find the people who represent you.</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">Browse by faculty, department, study centre, or academic session.</p>
          </div>
          <Link href="/directory" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 self-start rounded-[var(--radius-field)] bg-white px-5 py-3 text-sm font-bold text-brand-ink transition-colors hover:bg-brand-soft focus-visible:outline-white md:self-auto">
            Explore the directory <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-9 sm:px-6 lg:pt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-field)]">
              <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} />
              <span className="text-sm font-bold leading-snug text-ink">{inst.directoryTitle}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">{inst.name}</p>
            {inst.motto && <p className="mt-2 text-sm italic leading-relaxed text-brand">{inst.motto}</p>}
          </div>

          <nav aria-labelledby="footer-directory-title">
            <h2 id="footer-directory-title" className="text-sm font-bold text-ink">Discover</h2>
            <ul className="mt-3 space-y-1">
              {DIRECTORY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-brand hover:underline underline-offset-4">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-staff-title">
            <h2 id="footer-staff-title" className="text-sm font-bold text-ink">For representatives</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">Have an access code? Add your details and photo to the student directory.</p>
            <Link href="/representatives/join" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:underline underline-offset-4">
              <UserPlus size={16} aria-hidden="true" /> Register your profile
            </Link>
          </nav>

          <div className="rounded-[var(--radius-card)] border border-brand-line bg-brand-soft p-5">
            <div className="flex items-center gap-2 text-brand">
              <BookOpen size={18} aria-hidden="true" />
              <h2 className="text-sm font-bold">Make the most of the directory</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">Use filters to find your representative, or browse earlier sessions to explore past student leadership.</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/directory" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand hover:underline underline-offset-4"><Search size={14} aria-hidden="true" /> Search</Link>
              <Link href="/sessions" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-brand hover:underline underline-offset-4"><CalendarDays size={14} aria-hidden="true" /> Sessions</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line py-6 text-xs leading-relaxed text-muted sm:mt-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <p className="shrink-0">© {new Date().getFullYear()} {inst.shortName}. Student Representatives Directory.</p>
          <p className="max-w-lg lg:text-right">Contact details are shown according to representative and directory privacy settings. Please use shared details respectfully.</p>
        </div>
      </div>
    </footer>
  );
}
