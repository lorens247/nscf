import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getInstitution } from "@/lib/institution";
import "./globals.css";

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const inst = await getInstitution();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: inst.directoryTitle,
      template: `%s | ${inst.shortName} Student Representatives`,
    },
    description: `Official directory of student representatives of the ${inst.name} (${inst.shortName}).`,
    applicationName: inst.directoryTitle,
    openGraph: {
      type: "website",
      siteName: inst.name,
      title: inst.directoryTitle,
      description: `Find student representatives across ${inst.shortName} faculties, departments, programmes and study centres.`,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00643a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
