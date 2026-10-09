"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicSessions,
  departments,
  faculties,
  positions,
  programmes,
  states,
  studyCentres,
} from "@/db/schema";
import { requireRole } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";
import { getInstitution } from "@/lib/institution";
import { CATALOG_KINDS, catalogSchemas, formValues, type CatalogKind } from "@/lib/validators";

const WRITE = ["admin", "editor"] as const;

function isKind(v: string): v is CatalogKind {
  return (CATALOG_KINDS as string[]).includes(v);
}

function tabUrl(kind: string, extra: string) {
  return `/admin/catalog?tab=${kind}&${extra}`;
}

/** Builds the raw object for a catalog form. Checkboxes need an explicit boolean. */
function readCatalogForm(formData: FormData, kind: CatalogKind) {
  const v = formValues(formData);
  if (kind === "programme") return { ...v, departmentId: "" };
  if (kind === "session") return { ...v, isActive: formData.get("isActive") === "on" };
  return v;
}

export async function createCatalogItem(formData: FormData) {
  const user = await requireRole(WRITE);
  const kindRaw = String(formData.get("kind") ?? "");
  if (!isKind(kindRaw)) redirect("/admin/catalog");
  const kind = kindRaw as CatalogKind;

  const parsed = catalogSchemas[kind].safeParse(readCatalogForm(formData, kind));
  if (!parsed.success) {
    redirect(tabUrl(kind, `error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`));
  }

  const inst = await getInstitution();
  const data = parsed.data as Record<string, unknown>;
  let createdId: number | undefined;

  try {
    switch (kind) {
      case "faculty": {
        const d = parsed.data as { name: string; code: string };
        [{ id: createdId }] = await db.insert(faculties).values({ ...d, institutionId: inst.id }).returning({ id: faculties.id });
        break;
      }
      case "department": {
        const d = parsed.data as { name: string; code: string; facultyId: number | null };
        [{ id: createdId }] = await db.insert(departments).values({ ...d, institutionId: inst.id }).returning({ id: departments.id });
        break;
      }
      case "programme": {
        const d = parsed.data as { name: string; code: string; departmentId: number | null };
        [{ id: createdId }] = await db.insert(programmes).values({ ...d, institutionId: inst.id }).returning({ id: programmes.id });
        break;
      }
      case "centre": {
        const d = parsed.data as { name: string; location: string; stateId: number | null };
        [{ id: createdId }] = await db.insert(studyCentres).values({ ...d, institutionId: inst.id }).returning({ id: studyCentres.id });
        break;
      }
      case "session": {
        const d = parsed.data as { name: string; startYear: number; endYear: number; isActive: boolean };
        if (d.isActive) {
          // Only one session can be the current session.
          await db.update(academicSessions).set({ isActive: false });
        }
        [{ id: createdId }] = await db.insert(academicSessions).values({ ...d, institutionId: inst.id }).returning({ id: academicSessions.id });
        break;
      }
      case "position": {
        const d = parsed.data as { name: string; category: string };
        [{ id: createdId }] = await db.insert(positions).values({ ...d, institutionId: inst.id }).returning({ id: positions.id });
        break;
      }
      case "state": {
        const d = parsed.data as { name: string; code: string };
        [{ id: createdId }] = await db.insert(states).values({ ...d, institutionId: inst.id }).returning({ id: states.id });
        break;
      }
    }
  } catch {
    redirect(tabUrl(kind, "error=Could+not+save.+The+name+may+already+exist."));
  }

  await logAudit({ userId: user.id, action: "create", entity: kind, entityId: createdId ?? null, details: data });
  revalidatePath("/admin/catalog");
  revalidatePath("/directory");
  redirect(tabUrl(kind, "saved=created"));
}

export async function updateCatalogItem(formData: FormData) {
  const user = await requireRole(WRITE);
  const kindRaw = String(formData.get("kind") ?? "");
  const id = Number(formData.get("id"));
  if (!isKind(kindRaw) || !Number.isInteger(id) || id <= 0) redirect("/admin/catalog");
  const kind = kindRaw as CatalogKind;

  const parsed = catalogSchemas[kind].safeParse(readCatalogForm(formData, kind));
  if (!parsed.success) {
    redirect(`/admin/catalog/${kind}/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`);
  }

  const data = parsed.data as Record<string, unknown>;
  try {
    switch (kind) {
      case "faculty": {
        const d = parsed.data as { name: string; code: string };
        await db.update(faculties).set(d).where(eq(faculties.id, id));
        break;
      }
      case "department": {
        const d = parsed.data as { name: string; code: string; facultyId: number | null };
        await db.update(departments).set(d).where(eq(departments.id, id));
        break;
      }
      case "programme": {
        const d = parsed.data as { name: string; code: string; departmentId: number | null };
        await db.update(programmes).set(d).where(eq(programmes.id, id));
        break;
      }
      case "centre": {
        const d = parsed.data as { name: string; location: string; stateId: number | null };
        await db.update(studyCentres).set(d).where(eq(studyCentres.id, id));
        break;
      }
      case "session": {
        const d = parsed.data as { name: string; startYear: number; endYear: number; isActive: boolean };
        if (d.isActive) await db.update(academicSessions).set({ isActive: false });
        await db.update(academicSessions).set(d).where(eq(academicSessions.id, id));
        break;
      }
      case "position": {
        const d = parsed.data as { name: string; category: string };
        await db.update(positions).set(d).where(eq(positions.id, id));
        break;
      }
      case "state": {
        const d = parsed.data as { name: string; code: string };
        await db.update(states).set(d).where(eq(states.id, id));
        break;
      }
    }
  } catch {
    redirect(`/admin/catalog/${kind}/${id}/edit?error=${encodeURIComponent("Could not save this item.")}`);
  }

  await logAudit({ userId: user.id, action: "update", entity: kind, entityId: id, details: data });
  revalidatePath("/admin/catalog");
  revalidatePath("/directory");
  revalidatePath("/sessions");
  revalidatePath("/");
  redirect(tabUrl(kind, "saved=updated"));
}

export async function deleteCatalogItem(formData: FormData) {
  const user = await requireRole(["admin"]);
  const kindRaw = String(formData.get("kind") ?? "");
  const id = Number(formData.get("id"));
  if (!isKind(kindRaw) || !Number.isInteger(id) || id <= 0) redirect("/admin/catalog");
  const kind = kindRaw as CatalogKind;

  try {
    switch (kind) {
      case "faculty": await db.delete(faculties).where(eq(faculties.id, id)); break;
      case "department": await db.delete(departments).where(eq(departments.id, id)); break;
      case "programme": await db.delete(programmes).where(eq(programmes.id, id)); break;
      case "centre": await db.delete(studyCentres).where(eq(studyCentres.id, id)); break;
      case "session": await db.delete(academicSessions).where(eq(academicSessions.id, id)); break;
      case "position": await db.delete(positions).where(eq(positions.id, id)); break;
      case "state": await db.delete(states).where(eq(states.id, id)); break;
    }
  } catch {
    // Foreign keys block deletion while representatives or child records still refer to this item.
    redirect(tabUrl(kind, "error=This+item+is+in+use+and+cannot+be+deleted."));
  }

  await logAudit({ userId: user.id, action: "delete", entity: kind, entityId: id });
  revalidatePath("/admin/catalog");
  revalidatePath("/directory");
  redirect(tabUrl(kind, "saved=deleted"));
}
