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
  { label: "Dashboard", href: "/admin", roles: ["admin", "editor", "viewer"] },
  { label: "Representatives", href: "/admin/representatives", roles: ["admin", "editor", "viewer"] },
  { label: "Catalog", href: "/admin/catalog", roles: ["admin", "editor"] },
  { label: "Import CSV", href: "/admin/import", roles: ["admin", "editor"] },
  { label: "Export CSV", href: "/api/export", roles: ["admin", "editor", "viewer"] },
  { label: "Privacy", href: "/admin/privacy", roles: ["admin"] },
  { label: "Users & roles", href: "/admin/users", roles: ["admin"] },
  { label: "Audit log", href: "/admin/audit", roles: ["admin"] },
  { label: "Institution", href: "/admin/settings", roles: ["admin"] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const inst = await getInstitution();
  const [account] = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id)).limit(1);
  const items = NAV.filter((n) => n.roles.includes(user.role)).map(({ label, href }) => ({ label, href }));
  const displayName = account?.name || user.email;

  return (
    <div className="flex min-h-screen bg-tint">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white lg:flex xl:w-64">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-ink">{inst.shortName} Admin</p>
            <p className="truncate text-[11px] text-muted">Representatives</p>
          </div>
        </div>
        <nav aria-label="Admin sections" className="flex-1 overflow-y-auto p-3">
          <AdminNavList items={items} />
          <div className="mt-4 border-t border-line pt-3">
            <Link href="/directory" className="flex min-h-11 items-center rounded-[var(--radius-field)] px-3 text-sm font-semibold text-brand hover:bg-brand-soft">
              View public directory
            </Link>
          </div>
        </nav>
        <div className="border-t border-line p-3">
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
          <span className="hidden shrink-0 rounded-full bg-tint px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted sm:block">{user.role}</span>
        </header>
        <div id="main" className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
