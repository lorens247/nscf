import { and, eq, sql } from "drizzle-orm";
import type { db as database } from "./index";
import { hashSync } from "bcryptjs";
import {
  institutions,
  faculties,
  departments,
  programmes,
  positions,
  users,
  representatives,
} from "./schema";

type SeedTransaction = Parameters<Parameters<typeof database.transaction>[0]>[0];

async function ensureRecord<Row extends { id: number }>(find: () => Promise<Row[]>, insert: () => Promise<Row[]>): Promise<Row> {
  const [existing] = await find();
  if (existing) return existing;
  const [created] = await insert();
  return created;
}

/** Add missing demo records without changing existing records. Run inside a transaction. */
export async function seedDemo(db: SeedTransaction) {
  // Serialize seed runs because catalog identities do not have unique constraints.
  await db.execute(sql`select pg_advisory_xact_lock(64301927)`);
  // Create institution
  const inst = await ensureRecord(
    () => db.select().from(institutions).where(eq(institutions.shortName, "NOUN")).orderBy(institutions.id).limit(1),
    () => db.insert(institutions).values({
    name: "National Open University of Nigeria",
    shortName: "NOUN",
    motto: "Learn at any place at your pace.",
    directoryTitle: "NOUN Student Representatives Directory",
    logoUrl: "/logo.png",
  }).returning(),
  );
  console.log("Demo institution:", inst.id);

  // Create faculties
  const facultyData = [
    { name: "Faculty of Agricultural Sciences", code: "FAS" },
    { name: "Faculty of Arts", code: "FOA" },
    { name: "Faculty of Computing", code: "FCO" },
    { name: "Faculty of Education", code: "FED" },
    { name: "Faculty of Health Sciences", code: "FHS" },
    { name: "Faculty of Law", code: "FOL" },
    { name: "Faculty of Management Sciences", code: "FMS" },
    { name: "Faculty of Sciences", code: "FOS" },
    { name: "Faculty of Social Sciences", code: "FSS" },
  ];
  const insertedFaculties: Array<typeof faculties.$inferSelect> = [];
  for (const item of facultyData) {
    insertedFaculties.push(await ensureRecord(
      () => db.select().from(faculties).where(and(eq(faculties.institutionId, inst.id), eq(faculties.code, item.code))).orderBy(faculties.id).limit(1),
      () => db.insert(faculties).values({ ...item, institutionId: inst.id }).returning(),
    ));
  }
  console.log("Faculties:", insertedFaculties.length);

  // Create departments
  const deptData = [
    { name: "Agricultural Economics and Extension", code: "AEE", facultyCode: "FAS" },
    { name: "Animal Science and Fisheries", code: "ASF", facultyCode: "FAS" },
    { name: "Crop and Soil Science", code: "CSS", facultyCode: "FAS" },
    { name: "English", code: "ENG", facultyCode: "FOA" },
    { name: "Linguistics, Foreign and Nigerian Languages", code: "LFNL", facultyCode: "FOA" },
    { name: "Philosophy", code: "PHI", facultyCode: "FOA" },
    { name: "Religious Studies", code: "REL", facultyCode: "FOA" },
    { name: "Computer Science", code: "CSC", facultyCode: "FCO" },
    { name: "Information Systems and Technology", code: "IST", facultyCode: "FCO" },
    { name: "Cyber Security", code: "CYB", facultyCode: "FCO" },
    { name: "Arts and Social Sciences Education", code: "ASSE", facultyCode: "FED" },
    { name: "Educational Foundations", code: "EDF", facultyCode: "FED" },
    { name: "Human Kinetics and Health Education", code: "HKHE", facultyCode: "FED" },
    { name: "Library and Information Science", code: "LIS", facultyCode: "FED" },
    { name: "Science Education", code: "SED", facultyCode: "FED" },
    { name: "Environmental Health Science", code: "EHS", facultyCode: "FHS" },
    { name: "Nursing Science", code: "NS", facultyCode: "FHS" },
    { name: "Public Health Science", code: "PHS", facultyCode: "FHS" },
    { name: "Commercial Law", code: "CL", facultyCode: "FOL" },
    { name: "Jurisprudence and International Law", code: "JIL", facultyCode: "FOL" },
    { name: "Private and Property Law", code: "PPL", facultyCode: "FOL" },
    { name: "Public Law", code: "PL", facultyCode: "FOL" },
    { name: "Business Administration", code: "BA", facultyCode: "FMS" },
    { name: "Entrepreneurial Studies and Cooperatives Management", code: "ESCM", facultyCode: "FMS" },
    { name: "Financial Studies", code: "FS", facultyCode: "FMS" },
    { name: "Public Administration", code: "PA", facultyCode: "FMS" },
    { name: "Hospitality and Tourism Management", code: "HTM", facultyCode: "FMS" },
    { name: "CEMBA/CEMPA (Commonwealth Executive MBA and MPA programmes)", code: "CEMBA-CEMPA", facultyCode: "FMS" },
    { name: "Biological Science", code: "BIO", facultyCode: "FOS" },
    { name: "Chemistry", code: "CHE", facultyCode: "FOS" },
    { name: "Environmental Science", code: "ENV", facultyCode: "FOS" },
    { name: "Mathematics", code: "MAT", facultyCode: "FOS" },
    { name: "Physics", code: "PHY", facultyCode: "FOS" },
    { name: "Criminology and Security Studies", code: "CSSS", facultyCode: "FSS" },
    { name: "Development Studies", code: "DEV", facultyCode: "FSS" },
    { name: "Economics", code: "ECO", facultyCode: "FSS" },
    { name: "Mass Communication", code: "MCM", facultyCode: "FSS" },
    { name: "Peace Studies and Conflict Resolution", code: "PSCR", facultyCode: "FSS" },
    { name: "Political Science", code: "POL", facultyCode: "FSS" },
    { name: "Tourism Studies", code: "TS", facultyCode: "FSS" },
    { name: "Department of History", code: "HIS", facultyCode: "FOA" },
    { name: "Department of Accounting", code: "ACC", facultyCode: "FMS" },
  ];
  const insertedDepts: Array<typeof departments.$inferSelect> = [];
  for (const item of deptData) {
    const { facultyCode, ...department } = item;
    const faculty = insertedFaculties.find((candidate) => candidate.code === facultyCode);
    if (!faculty) throw new Error(`Faculty ${facultyCode} is missing from the seed data.`);
    const existingDepartment = await db.select().from(departments)
      .where(and(eq(departments.institutionId, inst.id), eq(departments.code, department.code)))
      .orderBy(departments.id)
      .limit(1);
    if (existingDepartment[0] && existingDepartment[0].facultyId !== faculty.id) {
      const [updatedDepartment] = await db.update(departments)
        .set({ facultyId: faculty.id })
        .where(eq(departments.id, existingDepartment[0].id))
        .returning();
      insertedDepts.push(updatedDepartment);
      continue;
    }
    insertedDepts.push(await ensureRecord(
      () => db.select().from(departments).where(and(eq(departments.institutionId, inst.id), eq(departments.code, department.code))).orderBy(departments.id).limit(1),
      () => db.insert(departments).values({ ...department, facultyId: faculty.id, institutionId: inst.id }).returning(),
    ));
  }
  console.log("Departments:", insertedDepts.length);
  const getFacultyId = (code: string) => {
    const faculty = insertedFaculties.find((candidate) => candidate.code === code);
    if (!faculty) throw new Error(`Faculty ${code} is missing from the seed data.`);
    return faculty.id;
  };
  const getDepartmentId = (code: string) => {
    const department = insertedDepts.find((candidate) => candidate.code === code);
    if (!department) throw new Error(`Department ${code} is missing from the seed data.`);
    return department.id;
  };

  // Programmes
  const progData = [
    { name: "BSc", code: "BSC" }, { name: "BA", code: "BA" },
    { name: "BEd", code: "BED" }, { name: "LLB", code: "LLB" },
    { name: "MSc", code: "MSC" }, { name: "MA", code: "MA" },
    { name: "MBA", code: "MBA" }, { name: "MEd", code: "MED" },
    { name: "PGD", code: "PGD" }, { name: "PhD", code: "PHD" },
  ];
  const insertedProgs = [];
  for (const item of progData) {
    insertedProgs.push(await ensureRecord(
      () => db.select().from(programmes).where(and(eq(programmes.institutionId, inst.id), eq(programmes.code, item.code))).orderBy(programmes.id).limit(1),
      () => db.insert(programmes).values({ ...item, institutionId: inst.id }).returning(),
    ));
  }
  console.log("Programmes:", insertedProgs.length);

  // Positions
  const posData = [
    { name: "President", category: "Executive" },
    { name: "Vice President", category: "Executive" },
    { name: "General Secretary", category: "Executive" },
    { name: "Faculty Representative", category: "Faculty" },
    { name: "Department Representative", category: "Department" },
  ];
  const insertedPositions = [];
  for (const item of posData) {
    insertedPositions.push(await ensureRecord(
      () => db.select().from(positions).where(and(eq(positions.institutionId, inst.id), eq(positions.name, item.name))).orderBy(positions.id).limit(1),
      () => db.insert(positions).values({ ...item, institutionId: inst.id }).returning(),
    ));
  }
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
      imageUrl: "/demo-reps/chidi-okonkwo.jpg",
      email: "chidi.o@noun.edu.ng",
      phone: "+234 801 234 5678",
      positionId: insertedPositions[0].id,
      departmentId: getDepartmentId("ENG"),
      programmeId: insertedProgs[1].id,
      studyCentreId: null,
      facultyId: getFacultyId("FOA"),
      academicSessionId: null,
      stateId: null,
      bio: "Passionate about student welfare and academic excellence.",
      contactPublic: true,
      isArchived: false,
    },
    {
      name: "Amina Bello",
      imageUrl: "/demo-reps/amina-bello.jpg",
      email: "amina.b@noun.edu.ng",
      phone: "+234 701 987 6543",
      positionId: insertedPositions[3].id,
      departmentId: getDepartmentId("MCM"),
      programmeId: insertedProgs[0].id,
      studyCentreId: null,
      facultyId: getFacultyId("FSS"),
      academicSessionId: null,
      stateId: null,
      bio: "Advocating for inclusive education and campus resources.",
      contactPublic: true,
      isArchived: false,
    },
    {
      name: "Emeka Nwankwo",
      imageUrl: "/demo-reps/emeka-nwankwo.jpg",
      email: "emeka.n@noun.edu.ng",
      phone: "+234 802 345 6789",
      positionId: insertedPositions[4].id,
      departmentId: getDepartmentId("ACC"),
      programmeId: insertedProgs[0].id,
      studyCentreId: null,
      facultyId: getFacultyId("FMS"),
      academicSessionId: null,
      stateId: null,
      bio: "Focused on student engagement and professional development.",
      contactPublic: false,
      isArchived: false,
    },
  ];
  for (const item of repData) {
    await ensureRecord(
      () => db.select().from(representatives).where(and(eq(representatives.institutionId, inst.id), eq(representatives.email, item.email))).orderBy(representatives.id).limit(1),
      () => db.insert(representatives).values({ ...item, institutionId: inst.id }).returning(),
    );
  }
  console.log("Representatives:", repData.length);
}
