import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(entry: {
  userId: number;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    details: entry.details ?? null,
  });
}
