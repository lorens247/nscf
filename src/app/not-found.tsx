import Link from "next/link";
import SiteLayout from "@/components/site-layout";
import { buttonPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <SiteLayout>
      <div className="mx-auto flex max-w-2xl flex-col items-start px-4 py-20 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Error 404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">We could not find that page</h1>
        <p className="mt-3 text-slate-600">The representative or page may have been archived or moved.</p>
        <Link href="/directory" className={`${buttonPrimary} mt-8`}>Browse the directory</Link>
      </div>
    </SiteLayout>
  );
}
