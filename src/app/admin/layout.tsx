import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-guard";
import { getInstitution } from "@/lib/institution";
import { Logo } from "@/components/logo";
import SignOutButton from "@/components/sign-out";
import AdminMobileNav, { AdminNavList, type AdminNavItem } from "@/components/admin-nav";

export const dynamic = "force-dynamic";

type NavEntry = AdminNavItem & { roles: string[] };

const NAV: NavEntry[] = [
  { group: "Overview", label: "Dashboard", href: "/admin", roles: ["admin", "editor", "viewer"] },
  { group: "Representatives", label: "Representatives", href: "/admin/representatives", roles: ["admin", "editor", "viewer"] },
  { group: "Representatives", label: "Rep access codes", href: "/admin/invitations", roles: ["admin", "editor"] },
  { group: "Academic catalog", label: "Faculties", href: "/admin/catalog?tab=faculty", roles: ["admin", "editor"] },
  { group: "Academic catalog", label: "Departments", href: "/admin/catalog?tab=department", roles: ["admin", "editor"] },
  { group: "Academic catalog", label: "Degree types", href: "/admin/catalog?tab=programme", roles: ["admin", "editor"] },
  { group: "Academic catalog", label: "Positions", href: "/admin/catalog?tab=position", roles: ["admin", "editor"] },
  { group: "Academic catalog", label: "All catalog entries", href: "/admin/catalog", roles: ["admin", "editor"] },
  { group: "Data tools", label: "Import CSV", href: "/admin/import", roles: ["admin", "editor"] },
  { group: "Data tools", label: "Export CSV", href: "/api/export", roles: ["admin", "editor", "viewer"] },
  { group: "Administration", label: "Privacy", href: "/admin/privacy", roles: ["admin"] },
  { group: "Administration", label: "Users & roles", href: "/admin/users", roles: ["admin"] },
  { group: "Administration", label: "Audit log", href: "/admin/audit", roles: ["admin"] },
  { group: "Administration", label: "Institution", href: "/admin/settings", roles: ["admin"] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const inst = await getInstitution();
  const [account] = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id)).limit(1);
  const items = NAV.filter((n) => n.roles.includes(user.role)).map(({ label, href, group }) => ({ label, href, group }));
  const displayName = account?.name || user.email;

  return (
    <div className="flex min-h-screen bg-tint">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink">
        Skip to content
      </a>

      <aside aria-label="Admin sidebar" className="admin-sidebar sticky top-0 h-dvh w-64 shrink-0 flex-col border-r border-line bg-white xl:w-72">
        <div className="flex h-24 shrink-0 items-center gap-2.5 border-b border-line px-5">
          <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink">{inst.shortName} Admin</p>
            <p className="truncate text-[11px] text-muted">Representatives</p>
          </div>
        </div>
        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto p-3">
          <AdminNavList items={items} />
          <div className="mt-4 border-t border-line pt-3">
            <Link href="/directory" className="flex min-h-11 items-center rounded-[var(--radius-field)] px-3 text-sm font-semibold text-brand hover:bg-brand-soft">
              View public directory
            </Link>
          </div>
        </nav>
        <div className="shrink-0 border-t border-line bg-white p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted">{displayName}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/97 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AdminMobileNav items={items} identity={displayName} />
            <span className="truncate text-sm font-bold text-ink">{inst.shortName} Administration</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-tint px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted sm:block">{user.role}</span>
            <SignOutButton />
          </div>
        </header>
        <div id="main" className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
