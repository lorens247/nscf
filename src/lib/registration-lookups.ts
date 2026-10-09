import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicSessions, departments, faculties, positions, programmes, states, studyCentres } from "@/db/schema";

export async function getRegistrationLookups(institutionId: number, client: Pick<typeof db, "select"> = db) {
  const positionRows = await client.select({ id: positions.id, name: positions.name }).from(positions).where(eq(positions.institutionId, institutionId)).orderBy(asc(positions.name));
  const facultyRows = await client.select({ id: faculties.id, name: faculties.name }).from(faculties).where(eq(faculties.institutionId, institutionId)).orderBy(asc(faculties.name));
  const departmentRows = await client.select({ id: departments.id, name: departments.name, facultyId: departments.facultyId }).from(departments).where(eq(departments.institutionId, institutionId)).orderBy(asc(departments.name));
  const programmeRows = await client.select({ id: programmes.id, name: programmes.name }).from(programmes).where(eq(programmes.institutionId, institutionId)).orderBy(asc(programmes.name));
  const centreRows = await client.select({ id: studyCentres.id, name: studyCentres.name }).from(studyCentres).where(eq(studyCentres.institutionId, institutionId)).orderBy(asc(studyCentres.name));
  const stateRows = await client.select({ id: states.id, name: states.name }).from(states).where(eq(states.institutionId, institutionId)).orderBy(asc(states.name));
  const sessionRows = await client.select({ id: academicSessions.id, name: academicSessions.name }).from(academicSessions).where(eq(academicSessions.institutionId, institutionId)).orderBy(desc(academicSessions.startYear));
  return { positions: positionRows, faculties: facultyRows, departments: departmentRows, programmes: programmeRows, studyCentres: centreRows, states: stateRows, sessions: sessionRows };
}
