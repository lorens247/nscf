"use client";

import { useId, useState } from "react";
import type { DepartmentOption, Option } from "@/lib/lookups";
import { inputClass } from "@/components/ui";

export default function FacultyDepartmentFields({ faculties, departments, facultyValue = "", departmentValue = "", fieldErrors, facultyName = "facultyId", departmentName = "departmentId" }: {
  faculties: Option[]; departments: DepartmentOption[]; facultyValue?: string; departmentValue?: string;
  fieldErrors?: Record<string, string>; facultyName?: string; departmentName?: string;
}) {
  const [faculty, setFaculty] = useState(facultyValue);
  const [department, setDepartment] = useState(departmentValue);
  const id = useId();
  const available = departments.filter((option) => String(option.facultyId) === faculty);
  return <>
    <div>
      <label htmlFor={`${id}-faculty`} className="block text-sm font-medium text-ink">Faculty</label>
      <select id={`${id}-faculty`} name={facultyName} value={faculty} onChange={(event) => { setFaculty(event.target.value); setDepartment(""); }} aria-invalid={!!fieldErrors?.facultyId} className={inputClass}>
        <option value="">Select a faculty</option>
        {faculties.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      {fieldErrors?.facultyId && <p className="mt-1 text-xs text-accent">{fieldErrors.facultyId}</p>}
    </div>
    <div>
      <label htmlFor={`${id}-department`} className="block text-sm font-medium text-ink">Department</label>
      <select id={`${id}-department`} name={departmentName} value={available.some((option) => String(option.id) === department) ? department : ""} onChange={(event) => setDepartment(event.target.value)} disabled={!faculty} aria-invalid={!!fieldErrors?.departmentId} aria-describedby={`${id}-help`} className={inputClass}>
        <option value="">{!faculty ? "Select a faculty first" : available.length ? "Select a department" : "No departments in this faculty"}</option>
        {available.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      <p id={`${id}-help`} className="mt-1 text-xs text-muted">{fieldErrors?.departmentId ?? "Only departments in your selected faculty are shown."}</p>
    </div>
  </>;
}
