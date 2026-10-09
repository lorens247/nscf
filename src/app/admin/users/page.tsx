import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole, ROLES } from "@/lib/auth-guard";
import { PageHeading, Notice, buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";
import { createUser, updateUserRole } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_HELP: Record<(typeof ROLES)[number], string> = {
  admin: "Full access, including users, settings and audit log",
  editor: "Manage representatives, catalog and imports",
  viewer: "Read-only access to records and exports",
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const actor = await requireRole(["admin"]);
  const sp = await searchParams;

  const list = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.name));

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Access" title="Users and roles" description="Staff who can sign in to this administration area." />

      {sp.saved === "created" && <Notice tone="success">User created. Share their password securely.</Notice>}
      {sp.saved === "role" && <Notice tone="success">Role updated.</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="add-user" className="rounded-[var(--radius-card)] border border-line bg-white p-5 lg:self-start">
          <h2 id="add-user" className="text-base font-semibold text-ink">Add a user</h2>
          <form action={createUser} className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink">Full name</label>
              <input id="name" name="name" required autoComplete="off" className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">Email</label>
              <input id="email" name="email" type="email" required autoComplete="off" className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink">Temporary password</label>
              <input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className={inputClass} />
              <p className="mt-1 text-xs text-muted">At least 10 characters.</p>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-ink">Role</label>
              <select id="role" name="role" defaultValue="editor" className={inputClass}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className={`${buttonPrimary} w-full`}>Create user</button>
          </form>
          <dl className="mt-6 space-y-3 border-t border-line pt-4 text-xs text-muted">
            {ROLES.map((r) => (
              <div key={r}><dt className="font-semibold capitalize text-ink">{r}</dt><dd>{ROLE_HELP[r]}</dd></div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="user-list" className="rounded-[var(--radius-card)] border border-line bg-white lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 id="user-list" className="text-base font-semibold text-ink">Accounts ({list.length})</h2>
          </div>
          <ul className="divide-y divide-line">
            {list.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{u.name} {u.id === actor.id && <span className="text-xs font-normal text-muted">(you)</span>}</p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                </div>
                {u.id === actor.id ? (
                  <span className="inline-flex h-11 items-center rounded-md bg-slate-100 px-3 text-sm font-medium capitalize text-muted">{u.role}</span>
                ) : (
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <label htmlFor={`role-${u.id}`} className="sr-only">Role for {u.name}</label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role} className={`${inputClass} mt-0 h-11 w-36`}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="submit" className={buttonSecondary}>Save</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
