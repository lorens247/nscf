import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import QRCode from "react-qr-code";
import { eq } from "drizzle-orm";
import SiteLayout from "@/components/site-layout";
import ShareActions from "@/components/share-actions";
import { db } from "@/db";
import { faculties, positions, representatives } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public base URL: NEXT_PUBLIC_SITE_URL in production, otherwise the request host. */
async function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  // Reverse proxies often report their internal hop as http. Public non-local hosts should be shared as https.
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("0.0.0.0");
  const proto = local ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [rep] = await db
    .select({
      id: representatives.id,
      name: representatives.name,
      isArchived: representatives.isArchived,
      positionName: positions.name,
      facultyName: faculties.name,
    })
    .from(representatives)
    .leftJoin(positions, eq(representatives.positionId, positions.id))
    .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
    .where(eq(representatives.id, id))
    .limit(1);
  if (!rep || rep.isArchived) notFound();

  const url = `${await baseUrl()}/directory/${rep.id}`;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:py-8">
        <Link href={`/directory/${rep.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Back to profile
        </Link>

        <div className="mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          <div className="border-b border-line px-5 py-4 sm:px-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand">Share card</p>
            <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{rep.name}</h1>
            <p className="mt-1 text-sm text-muted">{[rep.positionName, rep.facultyName].filter(Boolean).join(" · ") || "Student representative"}</p>
          </div>

          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="rounded-[var(--radius-card)] border border-line bg-white p-4">
              <QRCode value={url} size={168} level="M" fgColor="#06301f" bgColor="#ffffff" title={`QR code for ${rep.name}`} />
            </div>
            <div className="w-full min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Profile link</p>
              <p className="mt-1.5 break-all rounded-[var(--radius-field)] border border-line bg-tint p-3 font-mono text-xs text-ink">{url}</p>
              <p className="mt-3 text-sm text-muted">Point a camera at the code to open this profile. Only public details are shown.</p>
              <div className="mt-4">
                <ShareActions url={url} title={`${rep.name} · NOUN Student Representative`} />
              </div>
            </div>
          </div>

          <div className="border-t border-line bg-tint px-5 py-3.5 sm:px-7">
            <p className="text-xs text-muted">Tip: screenshot the code, or print this page at an induction event.</p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
