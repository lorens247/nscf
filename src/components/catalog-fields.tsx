import type { ReactNode } from "react";
import { inputClass } from "@/components/ui";
import type { CatalogKind } from "@/lib/validators";
import type { getLookups } from "@/lib/lookups";

type Lookups = Awaited<ReturnType<typeof getLookups>>;
type Defaults = Record<string, string | number | boolean | null | undefined>;

export default function CatalogFields({ kind, lookups, defaults = {}, prefix = "catalog" }: { kind: CatalogKind; lookups: Lookups; defaults?: Defaults; prefix?: string }) {
  const fieldId = (name: string) => `${prefix}-${name}`;
  const value = (name: string) => (defaults[name] === null || defaults[name] === undefined ? "" : String(defaults[name]));

  const Label = ({ name, children }: { name: string; children: ReactNode }) => (
    <label htmlFor={fieldId(name)} className="block text-sm font-semibold text-ink">{children}</label>
  );

  const Text = ({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder?: string; type?: string }) => (
    <div>
      <Label name={name}>{label}</Label>
      <input id={fieldId(name)} name={name} type={type} required defaultValue={value(name)} placeholder={placeholder} className={inputClass} />
    </div>
  );

  const Select = ({ name, label, options }: { name: string; label: string; options: { id: number; name: string }[] }) => (
    <div>
      <Label name={name}>{label}</Label>
      <select id={fieldId(name)} name={name} defaultValue={value(name)} className={inputClass}>
        <option value="">None</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  );

  switch (kind) {
    case "faculty":
      return <><Text name="name" label="Name" placeholder="Faculty of Arts" /><Text name="code" label="Code" placeholder="FOA" /></>;
    case "department":
      return <><Text name="name" label="Name" /><Text name="code" label="Code" /><Select name="facultyId" label="Faculty" options={lookups.faculties} /></>;
    case "programme":
      return <><Text name="name" label="Name" /><Text name="code" label="Code" /><Select name="departmentId" label="Department" options={lookups.departments} /></>;
    case "centre":
      return <><Text name="name" label="Name" /><Text name="location" label="Location" /><Select name="stateId" label="State" options={lookups.states} /></>;
    case "session":
      return (
        <>
          <Text name="name" label="Name" placeholder="2025/2026" />
          <div className="grid grid-cols-2 gap-3">
            <Text name="startYear" label="Start year" type="number" />
            <Text name="endYear" label="End year" type="number" />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border border-line p-3 text-sm font-semibold text-ink">
            <input type="checkbox" name="isActive" defaultChecked={Boolean(defaults.isActive)} className="h-5 w-5 accent-brand" />
            Set as current session
          </label>
        </>
      );
    case "position":
      return <><Text name="name" label="Name" placeholder="President" /><Text name="category" label="Category" placeholder="Executive" /></>;
    case "state":
      return <><Text name="name" label="Name" /><Text name="code" label="Code" placeholder="LG" /></>;
  }
}
