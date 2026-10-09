import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Notice, buttonPrimary, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth-guard";
import { getInstitution } from "@/lib/institution";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const { error } = await searchParams;
  const inst = await getInstitution();

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-tint px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo logoUrl={inst.logoUrl} shortName={inst.shortName} size="lg" />
          <h1 className="mt-4 text-xl font-bold text-ink">Administration sign in</h1>
          <p className="mt-1 text-sm text-muted">{inst.directoryTitle}</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,32,26,0.04)]">
          {(error === "invalid" || error === "CredentialsSignin") && (
            <div className="mb-4"><Notice tone="error">The email or password is incorrect.</Notice></div>
          )}
          {error === "AccessDenied" && (
            <div className="mb-4"><Notice tone="error">That account is not permitted to sign in.</Notice></div>
          )}
          <form action={loginAction} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-ink">Email</label>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="username" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-ink">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
            </div>
            <button type="submit" className={`${buttonPrimary} w-full`}>Sign in</button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">Restricted to authorised staff. Every action is recorded in the audit log.</p>
        <p className="mt-6 text-center"><Link href="/directory" className="text-sm font-bold text-brand hover:underline">Return to the directory</Link></p>
      </div>
    </main>
  );
}
