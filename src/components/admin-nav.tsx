"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import SignOutButton from "@/components/sign-out";

export type AdminNavItem = { label: string; href: string };

/** Highlights the current section. Used by both the sidebar and the mobile sheet. */
export function AdminNavList({ items, variant = "sidebar" }: { items: AdminNavItem[]; variant?: "sidebar" | "sheet" }) {
  const pathname = usePathname();

  if (variant === "sheet") {
    return (
      <ul className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] items-center rounded-[var(--radius-card)] border px-3.5 text-sm font-bold ${
                  active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-[var(--radius-field)] px-3 text-sm font-semibold transition-colors ${
                active ? "bg-brand-soft text-brand" : "text-muted hover:bg-tint hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Bottom sheet navigation for phones. Closes on navigation or Escape. */
export default function AdminMobileNav({ items, identity }: { items: AdminNavItem[]; identity: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-field)] border border-line-strong text-ink active:bg-tint"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-brand-ink/45" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Administration navigation"
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">Administration</p>
                <p className="truncate text-xs text-muted">{identity}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-tint text-ink">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-3">
              <AdminNavList items={items} variant="sheet" />
              <div className="mt-3 border-t border-line pt-3">
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
