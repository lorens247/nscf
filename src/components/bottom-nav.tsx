"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Search, ShieldCheck } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/directory", label: "Find", icon: Search, exact: false },
  { href: "/sessions", label: "Sessions", icon: CalendarDays, exact: false },
  { href: "/admin", label: "Admin", icon: ShieldCheck, exact: false },
];

/**
 * Bottom tab bar for phones and tablets. Kept out of the DOM on large screens.
 * Uses the safe-area inset so it clears the iOS home indicator.
 */
export function BottomNav() {
  const pathname = usePathname();

  // The admin area has its own chrome, so the public tab bar is hidden there.
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/98 pb-safe shadow-[0_-2px_16px_rgba(16,32,26,0.07)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-[var(--radius-field)] px-1 pb-1.5 pt-1.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-brand" : "text-muted hover:text-ink"
                }`}
              >
                <item.icon size={21} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                {item.label}
                <span className={`h-0.5 w-6 rounded-full ${active ? "bg-brand" : "bg-transparent"}`} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
