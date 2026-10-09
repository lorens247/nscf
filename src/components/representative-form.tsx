"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import type { Option, DepartmentOption } from "@/lib/lookups";
import FacultyDepartmentFields from "@/components/faculty-department-fields";
import { Notice, buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";

export type Lookups = {
  positions: Option[];
  faculties: Option[];
  departments: DepartmentOption[];
  programmes: Option[];
  studyCentres: Option[];
  states: Option[];
  sessions: Option[];
};

export type RepresentativeDefaults = Record<string, string>;

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  lookups: Lookups;
  defaults?: RepresentativeDefaults;
  id?: number;
  submitLabel: string;
  registrationCode?: string;
};

export default function RepresentativeForm({ action, lookups, defaults = {}, id, submitLabel, registrationCode }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const v = (key: string) => state.values?.[key] ?? defaults[key] ?? "";
  const err = (key: string) => state.fieldErrors?.[key];
  // After a failed submit, keep the user's choice; otherwise use the stored default.
  const contactChecked = state.values ? state.values.contactPublic === "on" : defaults.contactPublic === "on";

  return (
    <form action={formAction} noValidate className="space-y-8">
      {registrationCode && <input type="hidden" name="code" value={registrationCode} />}
      {id && <input type="hidden" name="id" value={id} />}
      {state.error && <Notice tone="error">{state.error}</Notice>}

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-ink">Personal details</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="name" label="Full name" required error={err("name")}>
            <input id="name" name="name" defaultValue={v("name")} required aria-invalid={!!err("name")} autoComplete="name" className={inputClass} />
          </Field>
          <Field id="email" label="Email" required={!!registrationCode} error={err("email")} hint="Shown publicly only if contact details are public.">
            <input id="email" name="email" type="email" required={!!registrationCode} defaultValue={v("email")} aria-invalid={!!err("email")} autoComplete="email" className={inputClass} />
          </Field>
          <Field id="phone" label="Phone" error={err("phone")}>
            <input id="phone" name="phone" type="tel" defaultValue={v("phone")} aria-invalid={!!err("phone")} autoComplete="tel" className={inputClass} />
          </Field>
          {registrationCode ? (
            <Field id="photo" label="Profile photo" error={err("photo")} hint="Optional. Upload a JPEG, PNG, or WebP image, up to 2 MB. Your photo will be public. If a submission fails, please select the photo again.">
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={!!err("photo")} className={inputClass} />
            </Field>
          ) : (
          <Field id="imageUrl" label="Photo URL" error={err("imageUrl")} hint="Optional. A link to an image file.">
            <input id="imageUrl" name="imageUrl" defaultValue={v("imageUrl")} aria-invalid={!!err("imageUrl")} className={inputClass} />
          </Field>
          )}
        </div>
        <Field id="bio" label="Biography" error={err("bio")} hint="Up to 1,000 characters.">
          <textarea id="bio" name="bio" rows={4} defaultValue={v("bio")} aria-invalid={!!err("bio")} className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-ink">Representation</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField id="positionId" label="Position" options={lookups.positions} value={v("positionId")} error={err("positionId")} />
          {lookups.sessions.length > 0 && <SelectField id="academicSessionId" label="Academic session" options={lookups.sessions} value={v("academicSessionId")} error={err("academicSessionId")} />}
          <FacultyDepartmentFields key={`${v("facultyId")}:${v("departmentId")}`} faculties={lookups.faculties} departments={lookups.departments} facultyValue={v("facultyId")} departmentValue={v("departmentId")} fieldErrors={state.fieldErrors} />
          <SelectField id="programmeId" label="Programme / degree type" options={lookups.programmes} value={v("programmeId")} error={err("programmeId")} />
          {lookups.studyCentres.length > 0 && <SelectField id="studyCentreId" label="Study centre" options={lookups.studyCentres} value={v("studyCentreId")} error={err("studyCentreId")} />}
          {lookups.states.length > 0 && <SelectField id="stateId" label="State" options={lookups.states} value={v("stateId")} error={err("stateId")} />}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-ink">Privacy</legend>
        <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-line p-4">
          <input type="checkbox" name="contactPublic" defaultChecked={contactChecked} className="mt-0.5 h-5 w-5 accent-brand" />
          <span>
            <span className="block text-sm font-medium text-ink">Show contact details publicly</span>
            <span className="block text-sm text-muted">When off, the email and phone are hidden from the public profile.</span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <Link href={registrationCode ? "/" : "/admin/representatives"} className={buttonSecondary}>Cancel</Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-accent" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-accent">{error}</p>}
    </div>
  );
}

function SelectField({ id, label, options, value, error }: { id: string; label: string; options: Option[]; value: string; error?: string }) {
  return (
    <Field id={id} label={label} error={error}>
      <select id={id} name={id} defaultValue={value} aria-invalid={!!error} className={inputClass}>
        <option value="">Not assigned</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </Field>
  );
}
