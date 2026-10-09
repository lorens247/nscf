import type { ReactNode } from "react";
import { inputClass } from "@/components/ui";
import type { CatalogKind } from "@/lib/validators";
import type { getLookups } from "@/lib/lookups";

type Lookups = Awaited<ReturnType<typeof getLookups>>;
type Defaults = Record<string, string | number | boolean | null | undefined>;

type FieldContext = { prefix: string; defaults: Defaults };

function fieldValue(defaults: Defaults, name: string) {
  return defaults[name] == null ? "" : String(defaults[name]);
}

const Label = ({ name, children, prefix }: { name: string; children: ReactNode; prefix: string }) => (
  <label htmlFor={`${prefix}-${name}`} className="block text-sm font-semibold text-ink">{children}</label>
);

const Text = ({ name, label, placeholder, type = "text", prefix, defaults }: FieldContext & { name: string; label: string; placeholder?: string; type?: string }) => (
  <div>
    <Label name={name} prefix={prefix}>{label}</Label>
    <input id={`${prefix}-${name}`} name={name} type={type} required defaultValue={fieldValue(defaults, name)} placeholder={placeholder} className={inputClass} />
  </div>
);

const Select = ({ name, label, options, prefix, defaults }: FieldContext & { name: string; label: string; options: { id: number; name: string }[] }) => (
  <div>
    <Label name={name} prefix={prefix}>{label}</Label>
    <select id={`${prefix}-${name}`} name={name} defaultValue={fieldValue(defaults, name)} className={inputClass}>
      <option value="">None</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </div>
);

export default function CatalogFields({ kind, lookups, defaults = {}, prefix = "catalog" }: { kind: CatalogKind; lookups: Lookups; defaults?: Defaults; prefix?: string }) {
  switch (kind) {
    case "faculty":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Name" placeholder="Faculty of Arts" /><Text prefix={prefix} defaults={defaults} name="code" label="Code" placeholder="FOA" /></>;
    case "department":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Name" /><Text prefix={prefix} defaults={defaults} name="code" label="Code" /><Select prefix={prefix} defaults={defaults} name="facultyId" label="Faculty" options={lookups.faculties} /></>;
    case "programme":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Degree type" placeholder="MSc, BSc, PGD" /><Text prefix={prefix} defaults={defaults} name="code" label="Code" placeholder="MSC" /></>;
    case "centre":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Name" /><Text prefix={prefix} defaults={defaults} name="location" label="Location" /><Select prefix={prefix} defaults={defaults} name="stateId" label="State" options={lookups.states} /></>;
    case "session":
      return (
        <>
          <Text prefix={prefix} defaults={defaults} name="name" label="Name" placeholder="2025/2026" />
          <div className="grid grid-cols-2 gap-3">
            <Text prefix={prefix} defaults={defaults} name="startYear" label="Start year" type="number" />
            <Text prefix={prefix} defaults={defaults} name="endYear" label="End year" type="number" />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border border-line p-3 text-sm font-semibold text-ink">
            <input type="checkbox" name="isActive" defaultChecked={Boolean(defaults.isActive)} className="h-5 w-5 accent-brand" />
            Set as current session
          </label>
        </>
      );
    case "position":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Name" placeholder="President" /><Text prefix={prefix} defaults={defaults} name="category" label="Category" placeholder="Executive" /></>;
    case "state":
      return <><Text prefix={prefix} defaults={defaults} name="name" label="Name" /><Text prefix={prefix} defaults={defaults} name="code" label="Code" placeholder="LG" /></>;
  }
}
