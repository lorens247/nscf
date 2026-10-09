import Link from "next/link";
import { Search } from "lucide-react";
import type { InstitutionInfo } from "@/lib/institution";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/sessions", label: "Sessions" },
];

/**
 * Compact institutional bar. On phones the primary navigation lives in the
 * bottom tab bar, so the header only carries identity and search.
 */
export function SiteHeader({ inst }: { inst: InstitutionInfo }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[108px] max-w-6xl items-center gap-3 px-4 sm:px-6 lg:h-[120px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-bold text-ink lg:text-[15px]">{inst.shortName} Student Representatives</span>
            <span className="hidden truncate text-xs text-muted sm:block">{inst.name}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-[var(--radius-field)] px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-tint hover:text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/representatives/join" className="ml-2 rounded-[var(--radius-field)] border border-brand px-3.5 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Rep registration</Link>
        </nav>

        <Link
          href="/directory"
          aria-label="Search the directory"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius-field)] border border-line-strong text-ink transition-colors hover:bg-tint lg:hidden"
        >
          <Search size={19} aria-hidden="true" />
        </Link>
      </div>
      <div className="h-[3px] bg-accent" aria-hidden="true" />
    </header>
  );
}
