import Link from "next/link";
import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout";
import { Notice, buttonPrimary, buttonSecondary } from "@/components/ui";

export const metadata: Metadata = { title: "Profile submitted", robots: { index: false, follow: false } };
export default async function RegistrationSuccess({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const profileId = Number(id);
  return <SiteLayout><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
    <h1 className="mb-5 text-2xl font-bold text-ink">Thank you for adding your details</h1>
    <Notice tone="success">Your profile has been submitted. Your access code can no longer be used.</Notice>
    <p className="mt-4 text-sm text-muted">Contact your administrator if your details need to change.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      {Number.isSafeInteger(profileId) && profileId > 0 && <Link href={`/directory/${profileId}`} className={buttonPrimary}>View your profile</Link>}
      <Link href="/directory" className={buttonSecondary}>Browse directory</Link>
    </div>
  </div></SiteLayout>;
}
