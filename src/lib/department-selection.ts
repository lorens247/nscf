import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";

export async function departmentSelectionError(facultyId: number | null, departmentId: number | null) {
  if (departmentId === null) return null;
  if (facultyId === null) return "Select a faculty before selecting a department.";
  const [department] = await db.select({ facultyId: departments.facultyId }).from(departments).where(eq(departments.id, departmentId)).limit(1);
  return department?.facultyId === facultyId ? null : "Choose a department in the selected faculty.";
}
