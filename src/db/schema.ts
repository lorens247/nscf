import { pgTable, serial, text, timestamp, integer, boolean, varchar, index, pgSchema, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const institutionSchema = pgSchema("institution");

export const institutions = pgTable("institution", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  motto: text("motto"),
  directoryTitle: text("directory_title").notNull(),
  logoUrl: text("logo_url"),
  branding: jsonb("branding").$type<{ primary?: string; accent?: string; background?: string }>().default({ primary: "#0a5c36", accent: "#c8102e", background: "#ffffff" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const states = pgTable("state", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const faculties = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departments = pgTable("department", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  facultyId: integer("faculty_id").references(() => faculties.id),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programmes = pgTable("programme", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyCentres = pgTable("study_centre", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  stateId: integer("state_id").references(() => states.id),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const academicSessions = pgTable("academic_session", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const positions = pgTable("position", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  password: text("password").notNull().default(""),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const representatives = pgTable("representative", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  positionId: integer("position_id").references(() => positions.id),
  departmentId: integer("department_id").references(() => departments.id),
  programmeId: integer("programme_id").references(() => programmes.id),
  studyCentreId: integer("study_centre_id").references(() => studyCentres.id),
  facultyId: integer("faculty_id").references(() => faculties.id),
  academicSessionId: integer("academic_session_id").references(() => academicSessions.id),
  stateId: integer("state_id").references(() => states.id),
  bio: text("bio"),
  contactPublic: boolean("contact_public").default(true).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  searchIndex: index("rep_search_idx").on(table.name, table.email),
}));

export const auditLogs = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  userId: integer("user_id").references(() => users.id),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const privacySettings = pgTable("privacy_setting", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  institutionId: integer("institution_id").references(() => institutions.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations (optional, for query convenience)
export const institutionRelations = relations(institutions, ({ many }) => ({
  faculties: many(faculties),
  departments: many(departments),
  programmes: many(programmes),
  studyCentres: many(studyCentres),
  academicSessions: many(academicSessions),
  positions: many(positions),
  states: many(states),
  representatives: many(representatives),
  users: many(users),
  auditLogs: many(auditLogs),
}));

export const facultyRelations = relations(faculties, ({ one, many }) => ({
  institution: one(institutions, { fields: [faculties.institutionId], references: [institutions.id] }),
  departments: many(departments),
}));

export const departmentRelations = relations(departments, ({ one, many }) => ({
  institution: one(institutions, { fields: [departments.institutionId], references: [institutions.id] }),
  faculty: one(faculties, { fields: [departments.facultyId], references: [faculties.id] }),
  programmes: many(programmes),
}));

export const programmeRelations = relations(programmes, ({ one }) => ({
  department: one(departments, { fields: [programmes.departmentId], references: [departments.id] }),
  institution: one(institutions, { fields: [programmes.institutionId], references: [institutions.id] }),
}));

export const representativeRelations = relations(representatives, ({ one }) => ({
  position: one(positions, { fields: [representatives.positionId], references: [positions.id] }),
  department: one(departments, { fields: [representatives.departmentId], references: [departments.id] }),
  programme: one(programmes, { fields: [representatives.programmeId], references: [programmes.id] }),
  studyCentre: one(studyCentres, { fields: [representatives.studyCentreId], references: [studyCentres.id] }),
  faculty: one(faculties, { fields: [representatives.facultyId], references: [faculties.id] }),
  academicSession: one(academicSessions, { fields: [representatives.academicSessionId], references: [academicSessions.id] }),
  state: one(states, { fields: [representatives.stateId], references: [states.id] }),
}));
