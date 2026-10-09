import { cache } from "react";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { positions, faculties, departments, programmes, studyCentres, states, academicSessions } from "@/db/schema";

export type Option = { id: number; name: string };

/** Reference data used by filters and forms. Cached per request. */
export const getLookups = cache(async () => {
  const [positionRows, facultyRows, departmentRows, programmeRows, centreRows, stateRows, sessionRows] = await Promise.all([
    db.select({ id: positions.id, name: positions.name }).from(positions).orderBy(asc(positions.name)),
    db.select({ id: faculties.id, name: faculties.name }).from(faculties).orderBy(asc(faculties.name)),
    db.select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(departments.name)),
    db.select({ id: programmes.id, name: programmes.name }).from(programmes).orderBy(asc(programmes.name)),
    db.select({ id: studyCentres.id, name: studyCentres.name }).from(studyCentres).orderBy(asc(studyCentres.name)),
    db.select({ id: states.id, name: states.name }).from(states).orderBy(asc(states.name)),
    db.select({ id: academicSessions.id, name: academicSessions.name }).from(academicSessions).orderBy(desc(academicSessions.startYear)),
  ]);
  return {
    positions: positionRows as Option[],
    faculties: facultyRows as Option[],
    departments: departmentRows as Option[],
    programmes: programmeRows as Option[],
    studyCentres: centreRows as Option[],
    states: stateRows as Option[],
    sessions: sessionRows as Option[],
  };
});
