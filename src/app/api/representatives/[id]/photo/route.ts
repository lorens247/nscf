import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { representativePhotos, representatives } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const representativeId = Number(id);
  if (!Number.isSafeInteger(representativeId) || representativeId <= 0) return new Response(null, { status: 404 });
  const [photo] = await db.select({ data: representativePhotos.data, contentType: representativePhotos.contentType }).from(representativePhotos)
    .innerJoin(representatives, eq(representativePhotos.representativeId, representatives.id))
    .where(and(eq(representatives.id, representativeId), eq(representatives.isArchived, false))).limit(1);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(Buffer.from(photo.data, "base64")), {
    headers: { "Content-Type": photo.contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
