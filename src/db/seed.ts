import { hashSync } from "bcryptjs";
import { config } from "dotenv";
import {
  institutions,
  states,
  faculties,
  departments,
  programmes,
  studyCentres,
  academicSessions,
  positions,
  users,
  representatives,
} from "./schema";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const { db: database, pool } = await import("./index");

async function seed() {
  await database.transaction(async (db) => {
  // Clear existing (optional for fresh start)
  // We don't clear to avoid destroying data on rerun, but for initial seed:

  // Create institution
  const [inst] = await db.insert(institutions).values({
    name: "National Open University of Nigeria",
    shortName: "NOUN",
    motto: "Learn at any place at your pace.",
    directoryTitle: "NOUN Student Representatives Directory",
    logoUrl: "/logo-placeholder.svg",
  }).returning();
  console.log("Institution created:", inst.id);

  // Create states
  const stateData = [
    { name: "Lagos", code: "LG" },
    { name: "Abuja", code: "FCT" },
    { name: "Oyo", code: "OY" },
    { name: "Enugu", code: "EN" },
  ];
  const insertedStates = await db.insert(states).values(stateData.map(s => ({ ...s, institutionId: inst.id }))).returning();
  console.log("States:", insertedStates.length);

  // Create faculties
  const facultyData = [
    { name: "Faculty of Arts", code: "FOA" },
    { name: "Faculty of Social Sciences", code: "FSS" },
    { name: "Faculty of Management Sciences", code: "FMS" },
    { name: "Faculty of Education", code: "FED" },
    { name: "Faculty of Health Sciences", code: "FHS" },
  ];
  const insertedFaculties = await db.insert(faculties).values(facultyData.map(f => ({ ...f, institutionId: inst.id }))).returning();
  console.log("Faculties:", insertedFaculties.length);

  // Create departments (under first faculty for demo)
  const deptData = [
    { name: "Department of English", code: "ENG", facultyId: insertedFaculties[0].id },
    { name: "Department of History", code: "HIS", facultyId: insertedFaculties[0].id },
    { name: "Department of Mass Communication", code: "MCM", facultyId: insertedFaculties[1].id },
    { name: "Department of Accounting", code: "ACC", facultyId: insertedFaculties[2].id },
  ];
  const insertedDepts = await db.insert(departments).values(deptData.map(d => ({ ...d, institutionId: inst.id }))).returning();
  console.log("Departments:", insertedDepts.length);

  // Programmes
  const progData = [
    { name: "B.A. English", code: "BAE", departmentId: insertedDepts[0].id },
    { name: "B.A. History", code: "BAH", departmentId: insertedDepts[1].id },
    { name: "B.Sc. Mass Communication", code: "BSM", departmentId: insertedDepts[2].id },
    { name: "B.Sc. Accounting", code: "BSA", departmentId: insertedDepts[3].id },
  ];
  const insertedProgs = await db.insert(programmes).values(progData.map(p => ({ ...p, institutionId: inst.id }))).returning();
  console.log("Programmes:", insertedProgs.length);

  // Study centres
  const centreData = [
    { name: "NOUN Study Centre, Lagos", location: "Lagos", stateId: insertedStates[0].id },
    { name: "NOUN Study Centre, Abuja", location: "Abuja", stateId: insertedStates[1].id },
    { name: "NOUN Study Centre, Ibadan", location: "Ibadan", stateId: insertedStates[2].id },
  ];
  const insertedCentres = await db.insert(studyCentres).values(centreData.map(c => ({ ...c, institutionId: inst.id }))).returning();
  console.log("Study centres:", insertedCentres.length);

  // Academic sessions
  const sessionData = [
    { name: "2023/2024", startYear: 2023, endYear: 2024, isActive: true },
    { name: "2024/2025", startYear: 2024, endYear: 2025, isActive: false },
  ];
  const insertedSessions = await db.insert(academicSessions).values(sessionData.map(s => ({ ...s, institutionId: inst.id }))).returning();
  console.log("Sessions:", insertedSessions.length);

  // Positions
  const posData = [
    { name: "President", category: "Executive" },
    { name: "Vice President", category: "Executive" },
    { name: "General Secretary", category: "Executive" },
    { name: "Faculty Representative", category: "Faculty" },
    { name: "Department Representative", category: "Department" },
  ];
  const insertedPositions = await db.insert(positions).values(posData.map(p => ({ ...p, institutionId: inst.id }))).returning();
  console.log("Positions:", insertedPositions.length);

  // Admin user
  await db.insert(users).values({
    email: "admin@noun.edu.ng",
    name: "Administrator",
    role: "admin",
    password: hashSync("admin123", 12),
    institutionId: inst.id,
  }).onConflictDoNothing({ target: users.email });
  console.log("Admin user seeded");

  // Representatives
  const repData = [
    {
      name: "Chidi Okonkwo",
      email: "chidi.o@noun.edu.ng",
      phone: "+234 801 234 5678",
      positionId: insertedPositions[0].id,
      departmentId: insertedDepts[0].id,
      programmeId: insertedProgs[0].id,
      studyCentreId: insertedCentres[0].id,
      facultyId: insertedFaculties[0].id,
      academicSessionId: insertedSessions[0].id,
      stateId: insertedStates[0].id,
      bio: "Passionate about student welfare and academic excellence.",
      contactPublic: true,
      isArchived: false,
    },
    {
      name: "Amina Bello",
      email: "amina.b@noun.edu.ng",
      phone: "+234 701 987 6543",
      positionId: insertedPositions[3].id,
      departmentId: insertedDepts[2].id,
      programmeId: insertedProgs[2].id,
      studyCentreId: insertedCentres[1].id,
      facultyId: insertedFaculties[1].id,
      academicSessionId: insertedSessions[0].id,
      stateId: insertedStates[1].id,
      bio: "Advocating for inclusive education and campus resources.",
      contactPublic: true,
      isArchived: false,
    },
    {
      name: "Emeka Nwankwo",
      email: "emeka.n@noun.edu.ng",
      phone: "+234 802 345 6789",
      positionId: insertedPositions[4].id,
      departmentId: insertedDepts[3].id,
      programmeId: insertedProgs[3].id,
      studyCentreId: insertedCentres[2].id,
      facultyId: insertedFaculties[2].id,
      academicSessionId: insertedSessions[0].id,
      stateId: insertedStates[2].id,
      bio: "Focused on student engagement and professional development.",
      contactPublic: false,
      isArchived: false,
    },
  ];
  await db.insert(representatives).values(repData.map(r => ({ ...r, institutionId: inst.id })));
  console.log("Representatives:", repData.length);
  });
}

seed().catch(() => {
  console.error("Demo seed failed; the transaction was rolled back.");
  process.exitCode = 1;
}).finally(() => pool.end());
