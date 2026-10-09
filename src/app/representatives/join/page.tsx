import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout";
import RegistrationAccessForm from "@/components/registration-access-form";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Representative registration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function RegistrationPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <PageHeading eyebrow="For student representatives" title="Add your representative profile" description="Use your access code to share your details, representation, and photo. Your submitted profile and photo will appear in the public directory; you choose whether to show your contact details." />
        <div className="mt-7 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8"><RegistrationAccessForm /></div>
      </div>
    </SiteLayout>
  );
}
