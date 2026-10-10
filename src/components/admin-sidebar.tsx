"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminNavList, type AdminNavItem } from "@/components/admin-nav";
import { Logo } from "@/components/logo";

export default function AdminSidebar({ items, identity, shortName, logoUrl }: {
  items: AdminNavItem[];
  identity: string;
  shortName: string;
  logoUrl: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside aria-label="Admin sidebar" data-collapsed={collapsed} className="admin-sidebar sticky top-0 h-dvh shrink-0 flex-col border-r border-line bg-white">
      <div className="flex shrink-0 flex-col border-b border-line">
        {!collapsed && <div className="flex h-24 items-center gap-2.5 px-5">
          <Logo logoUrl={logoUrl} shortName={shortName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink">{shortName} Admin</p>
            <p className="truncate text-[11px] text-muted">Representatives</p>
          </div>
        </div>}
        <button type="button" onClick={() => setCollapsed((value) => !value)}
          aria-label={toggleLabel} title={toggleLabel} aria-expanded={!collapsed} aria-controls="admin-sidebar-navigation"
          className="m-3 flex min-h-11 items-center gap-3 rounded-[var(--radius-field)] border border-line-strong px-3 text-sm font-semibold text-ink hover:bg-tint">
          <ToggleIcon size={18} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
      <nav id="admin-sidebar-navigation" aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto p-3">
        <AdminNavList items={items} collapsed={collapsed} />
        <div className="mt-4 border-t border-line pt-3">
          <Link href="/directory" title={collapsed ? "View public directory" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-[var(--radius-field)] px-3 text-sm font-semibold text-brand hover:bg-brand-soft">
            <ExternalLink size={18} className="shrink-0" aria-hidden="true" />
            <span className={collapsed ? "sr-only" : undefined}>View public directory</span>
          </Link>
        </div>
      </nav>
      {!collapsed && <div className="shrink-0 border-t border-line p-3">
        <p className="truncate px-3 text-xs text-muted">{identity}</p>
      </div>}
    </aside>
  );
}
