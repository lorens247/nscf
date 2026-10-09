"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, KeyRound, GraduationCap, Building2, BookOpen, Briefcase, Upload, Download, ShieldCheck, Settings, ScrollText, List } from "lucide-react";
import { useSheetEffects } from "@/components/use-sheet-effects";
import SignOutButton from "@/components/sign-out";

export type AdminNavItem = { label: string; href: string; group?: string };

const ICONS = {
  Dashboard: LayoutDashboard, Representatives: Users, "Rep access codes": KeyRound,
  Faculties: Building2, Departments: BookOpen, "Degree types": GraduationCap,
  Positions: Briefcase, "Import CSV": Upload, "Export CSV": Download,
  Privacy: ShieldCheck, "Users & roles": Users, "Audit log": ScrollText, Institution: Settings,
};

/** Grouped menus shared by desktop navigation and the mobile drawer. */
export function AdminNavList({ items, variant = "sidebar" }: { items: AdminNavItem[]; variant?: "sidebar" | "sheet" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = [...new Set(items.map((item) => item.group ?? "Menu"))];
  return <div className="space-y-5">
    {groups.map((group) => <div key={group}>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{group}</p>
      <ul className={variant === "sheet" ? "grid grid-cols-2 gap-2" : "space-y-1"}>
        {items.filter((item) => (item.group ?? "Menu") === group).map((item) => {
          const [path, query] = item.href.split("?");
          const tab = new URLSearchParams(query).get("tab");
          const active = path === "/admin/catalog"
            ? pathname === path && (tab ? (searchParams.get("tab") ?? "faculty") === tab : false)
            : path === "/admin" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
          const Icon = ICONS[item.label as keyof typeof ICONS] ?? List;
          return <li key={item.href}>
            <Link href={item.href} aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-field)] px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-brand text-white" : "text-muted hover:bg-brand-soft hover:text-brand"}`}>
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          </li>;
        })}
      </ul>
    </div>)}
  </div>;
}

/** Sidebar drawer navigation for phones. Closes on navigation or Escape. */
export default function AdminMobileNav({ items, identity }: { items: AdminNavItem[]; identity: string }) {
  const pathname = usePathname();
  return <AdminMobileSheet key={pathname} items={items} identity={identity} />;
}

function AdminMobileSheet({ items, identity }: { items: AdminNavItem[]; identity: string }) {
  const [open, setOpen] = useState(false);
  useSheetEffects(open, setOpen);

  return (
    <div className="admin-menu-toggle">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-field)] border border-line-strong text-ink active:bg-tint"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-brand-ink/45" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Administration navigation"
            className="absolute inset-y-0 left-0 flex h-dvh w-[min(88vw,360px)] flex-col overflow-hidden bg-white shadow-2xl"
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
            <nav aria-label="Mobile admin sections" className="min-h-0 flex-1 overflow-y-auto p-3">
              <AdminNavList items={items} />
            </nav>
            <div className="shrink-0 border-t border-line bg-white p-3 pb-safe">
              <SignOutButton />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
