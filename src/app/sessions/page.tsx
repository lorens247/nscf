import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout";
import { db } from "@/db";
import { academicSessions, representatives } from "@/db/schema";
import { EmptyState, PageHeading } from "@/components/ui";
import { getInstitution } from "@/lib/institution";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Academic sessions",
  description: "Browse current and historical NOUN student representatives by academic session.",
};

export default async function SessionsPage() {
  const inst = await getInstitution();
  const sessions = await db
    .select({
      id: academicSessions.id,
      name: academicSessions.name,
      startYear: academicSessions.startYear,
      endYear: academicSessions.endYear,
      isActive: academicSessions.isActive,
      total: sql<number>`count(${representatives.id})::int`,
    })
    .from(academicSessions)
    .leftJoin(representatives, eq(representatives.academicSessionId, academicSessions.id))
    .groupBy(academicSessions.id)
    .orderBy(desc(academicSessions.startYear));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:py-12">
        <PageHeading
          eyebrow="Directory history"
          title="Academic sessions"
          description={`Switch between current and historical ${inst.shortName} student representative records.`}
        />

        {sessions.length === 0 ? (
          <EmptyState text="No academic sessions have been configured yet." />
        ) : (
          <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/directory?session=${session.id}`}
                  className="group flex h-full items-center gap-4 rounded-[var(--radius-card)] border border-line bg-white p-4 transition-colors hover:border-brand hover:bg-brand-soft sm:p-5"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${session.isActive ? "bg-brand text-white" : "bg-tint text-muted"}`}>
                    <CalendarDays size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-ink">{session.name}</span>
                      {session.isActive && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Current</span>}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {session.total} representative{session.total === 1 ? "" : "s"} · {session.startYear}–{session.endYear}
                    </span>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-line-strong group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <h2 className="text-sm font-bold text-ink">Looking for someone specific?</h2>
          <p className="mt-1 text-sm text-muted">Search every published session by name, faculty, department or centre.</p>
          <Link href="/directory" className="mt-4 inline-flex min-h-11 items-center rounded-[var(--radius-field)] bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">
            Search the full directory
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
