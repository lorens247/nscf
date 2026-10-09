import type { ReactNode } from "react";
import { getInstitution } from "@/lib/institution";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { BottomNav } from "@/components/bottom-nav";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const inst = await getInstitution();
  return (
    <div className="flex min-h-screen flex-col bg-tint">
      <SiteHeader inst={inst} />
      {/* Bottom padding clears the fixed tab bar on small screens. */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <SiteFooter inst={inst} />
      <BottomNav />
    </div>
  );
}
