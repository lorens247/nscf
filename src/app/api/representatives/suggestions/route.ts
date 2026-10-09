import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { representatives } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  const headers = { "Cache-Control": "no-store" };
  if (q.length < 2) return Response.json({ suggestions: [] }, { headers });
  const escaped = q.replace(/[\\%_]/g, (character) => `\\${character}`);
  try {
    const rows = await db.selectDistinct({ name: representatives.name }).from(representatives)
      .where(and(eq(representatives.isArchived, false), ilike(representatives.name, `%${escaped}%`)))
      .orderBy(asc(representatives.name)).limit(8);
    return Response.json({ suggestions: rows }, { headers });
  } catch {
    return Response.json({ suggestions: [] }, { status: 503, headers });
  }
}
