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
    { name: "Faculty of Arts", code: "FOA" },
    { name: "Faculty of Social Sciences", code: "FSS" },
    { name: "Faculty of Management Sciences", code: "FMS" },
    { name: "Faculty of Education", code: "FED" },
    { name: "Faculty of Health Sciences", code: "FHS" },
  ];
  const insertedFaculties = [];
  for (const item of facultyData) {
    insertedFaculties.push(await ensureRecord(
      () => db.select().from(faculties).where(and(eq(faculties.institutionId, inst.id), eq(faculties.code, item.code))).orderBy(faculties.id).limit(1),
      () => db.insert(faculties).values({ ...item, institutionId: inst.id }).returning(),
    ));
  }
  console.log("Faculties:", insertedFaculties.length);

  // Create departments (under first faculty for demo)
  const deptData = [
    { name: "Department of English", code: "ENG", facultyId: insertedFaculties[0].id },
    { name: "Department of History", code: "HIS", facultyId: insertedFaculties[0].id },
    { name: "Department of Mass Communication", code: "MCM", facultyId: insertedFaculties[1].id },
    { name: "Department of Accounting", code: "ACC", facultyId: insertedFaculties[2].id },
  ];
  const insertedDepts = [];
  for (const item of deptData) {
    insertedDepts.push(await ensureRecord(
      () => db.select().from(departments).where(and(eq(departments.institutionId, inst.id), eq(departments.code, item.code))).orderBy(departments.id).limit(1),
      () => db.insert(departments).values({ ...item, institutionId: inst.id }).returning(),
    ));
  }
  console.log("Departments:", insertedDepts.length);

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
      departmentId: insertedDepts[0].id,
      programmeId: insertedProgs[1].id,
      studyCentreId: null,
      facultyId: insertedFaculties[0].id,
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
      departmentId: insertedDepts[2].id,
      programmeId: insertedProgs[0].id,
      studyCentreId: null,
      facultyId: insertedFaculties[1].id,
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
      departmentId: insertedDepts[3].id,
      programmeId: insertedProgs[0].id,
      studyCentreId: null,
      facultyId: insertedFaculties[2].id,
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
