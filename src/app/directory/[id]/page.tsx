import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Mail, Phone, Share2, ShieldCheck } from "lucide-react";
import { eq } from "drizzle-orm";
import SiteLayout from "@/components/site-layout";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, representatives, states, studyCentres } from "@/db/schema";
import { contactVisible, getPrivacy } from "@/lib/privacy";
import { Initials, buttonSecondary } from "@/components/ui";

export const dynamic = "force-dynamic";

async function loadRepresentative(rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const [row] = await db
    .select({
      id: representatives.id,
      name: representatives.name,
      email: representatives.email,
      phone: representatives.phone,
      bio: representatives.bio,
      level: representatives.level,
      imageUrl: representatives.imageUrl,
      contactPublic: representatives.contactPublic,
      isArchived: representatives.isArchived,
      positionName: positions.name,
      facultyName: faculties.name,
      departmentName: departments.name,
      programmeName: programmes.name,
      centreName: studyCentres.name,
      centreLocation: studyCentres.location,
      stateName: states.name,
      sessionName: academicSessions.name,
    })
    .from(representatives)
    .leftJoin(positions, eq(representatives.positionId, positions.id))
    .leftJoin(faculties, eq(representatives.facultyId, faculties.id))
    .leftJoin(departments, eq(representatives.departmentId, departments.id))
    .leftJoin(programmes, eq(representatives.programmeId, programmes.id))
    .leftJoin(studyCentres, eq(representatives.studyCentreId, studyCentres.id))
    .leftJoin(states, eq(representatives.stateId, states.id))
    .leftJoin(academicSessions, eq(representatives.academicSessionId, academicSessions.id))
    .where(eq(representatives.id, id))
    .limit(1);

  return row ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const rep = await loadRepresentative((await params).id);
  if (!rep) return { title: "Representative not found" };
  return {
    title: `${rep.name}${rep.positionName ? ` · ${rep.positionName}` : ""}`,
    description: `${rep.name}${rep.positionName ? `, ${rep.positionName}` : ""} at the National Open University of Nigeria${rep.facultyName ? ` (${rep.facultyName})` : ""}.`,
    openGraph: { title: `${rep.name} · NOUN Student Representative` },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const rep = await loadRepresentative(rawId);
  if (!rep || rep.isArchived) notFound();

  const privacy = await getPrivacy();
  const showEmail = contactVisible(privacy, rep.contactPublic, "email") && Boolean(rep.email);
  const showPhone = contactVisible(privacy, rep.contactPublic, "phone") && Boolean(rep.phone);

  const details: [string, string | null][] = [
    ["Position", rep.positionName],
    ["Faculty", rep.facultyName],
    ["Department", rep.departmentName],
    ["Programme", rep.programmeName],
    ["Level", rep.level === null ? null : String(rep.level)],
    ["Study centre", rep.centreName ? `${rep.centreName}${rep.centreLocation ? ` (${rep.centreLocation})` : ""}` : null],
    ["State", rep.stateName],
    ["Academic session", rep.sessionName],
  ];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6 lg:pb-12 lg:pt-8">
        <Link href="/directory" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Directory
        </Link>

        {/* Identity */}
        <header className="mt-2 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-7">
          <div className="flex items-start gap-4">
            {rep.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20" />
            ) : (
              <Initials name={rep.name} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold leading-tight text-ink sm:text-3xl">{rep.name}</h1>
              <p className="mt-1 text-[15px] font-semibold text-brand">{rep.positionName ?? "Student representative"}</p>
              <p className="mt-2 text-sm text-muted">{[rep.facultyName, rep.departmentName].filter(Boolean).join(" · ") || "Faculty not yet assigned"}</p>
            </div>
          </div>

          {rep.sessionName && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-tint px-3 py-1.5 text-xs font-bold text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {rep.sessionName} session
            </p>
          )}

          {/* Inline actions: stacked full-width on phones, inline from sm */}
          <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
            {showEmail && (
              <a href={`mailto:${rep.email}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">
                <Mail size={17} aria-hidden="true" /> Email {rep.name.split(" ")[0]}
              </a>
            )}
            {showPhone && (
              <a href={`tel:${rep.phone?.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-brand px-5 text-sm font-bold text-brand hover:bg-brand-soft">
                <Phone size={17} aria-hidden="true" /> Call
              </a>
            )}
            <Link href={`/directory/${rep.id}/share`} className={`${buttonSecondary} sm:ml-auto`}>
              <Share2 size={17} aria-hidden="true" /> Share & QR
            </Link>
          </div>

          {!showEmail && !showPhone && (
            <p className="mt-4 flex items-start gap-2.5 rounded-[var(--radius-field)] bg-tint p-3.5 text-sm text-muted">
              <ShieldCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
              <span>Contact details are private for this representative. Write to the {rep.facultyName ?? "faculty"} office through the university’s official channels.</span>
            </p>
          )}
        </header>

        {/* Biography */}
        {rep.bio && (
          <section aria-labelledby="bio" className="mt-4 rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-7">
            <h2 id="bio" className="text-sm font-bold uppercase tracking-[0.08em] text-muted">About</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink">{rep.bio}</p>
          </section>
        )}

        {/* Details */}
        <section aria-labelledby="details" className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          <h2 id="details" className="border-b border-line px-5 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-muted sm:px-7">
            Academic details
          </h2>
          <dl className="divide-y divide-line">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-3 sm:px-7">
                <dt className="shrink-0 text-sm text-muted">{label}</dt>
                <dd className={`min-w-0 truncate text-right text-sm font-semibold ${value ? "text-ink" : "text-line-strong"}`}>{value ?? "Not set"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
          Information is maintained by student administration. <Link href={`/directory/${rep.id}/share`} className="font-semibold text-brand hover:underline">Generate a QR code</Link> to share this profile at an event.
        </p>
      </div>

    </SiteLayout>
  );
}
