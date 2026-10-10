import { z } from "zod";
import { REPRESENTATIVE_LEVELS } from "./representative-levels";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((v) => (v === "" ? null : v));

const requiredText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

/** Select fields submit "" when nothing is chosen. */
const optionalId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Invalid selection");

const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address")
  .transform((v) => (v === "" ? null : v));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Use an http(s) link or a /path")
  .transform((v) => (v === "" ? null : v));

export const representativeSchema = z.object({
  name: requiredText(2, 120, "Full name"),
  email: optionalEmail,
  phone: text(30),
  bio: text(1000),
  level: z.string().trim().default("")
    .transform((value) => value === "" ? null : Number(value))
    .refine((value) => value === null || REPRESENTATIVE_LEVELS.some((level) => level === value), "Choose a valid level"),
  imageUrl: optionalUrl,
  positionId: optionalId,
  facultyId: optionalId,
  departmentId: optionalId,
  programmeId: optionalId,
  studyCentreId: optionalId,
  academicSessionId: optionalId,
  stateId: optionalId,
  contactPublic: z.boolean(),
});

export type RepresentativeInput = z.infer<typeof representativeSchema>;

export const catalogSchemas = {
  faculty: z.object({ name: requiredText(2, 120, "Name"), code: requiredText(1, 20, "Code") }),
  department: z.object({
    name: requiredText(2, 120, "Name"),
    code: requiredText(1, 20, "Code"),
    facultyId: optionalId,
  }),
  programme: z.object({
    name: requiredText(2, 120, "Name"),
    code: requiredText(1, 20, "Code"),
    departmentId: optionalId,
  }),
  centre: z.object({
    name: requiredText(2, 120, "Name"),
    location: requiredText(2, 120, "Location"),
    stateId: optionalId,
  }),
  session: z
    .object({
      name: requiredText(4, 20, "Name"),
      startYear: z.coerce.number().int().min(1950).max(2100),
      endYear: z.coerce.number().int().min(1950).max(2100),
      isActive: z.boolean(),
    })
    .refine((v) => v.endYear === v.startYear + 1, { message: "End year must be start year + 1", path: ["endYear"] }),
  position: z.object({ name: requiredText(2, 120, "Name"), category: requiredText(2, 40, "Category") }),
  state: z.object({ name: requiredText(2, 80, "Name"), code: requiredText(2, 10, "Code") }),
};

export type CatalogKind = keyof typeof catalogSchemas;
export const CATALOG_KINDS = Object.keys(catalogSchemas) as CatalogKind[];

export function issuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Converts FormData into a plain object of strings (files are dropped). */
export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
