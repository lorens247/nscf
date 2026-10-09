"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Option } from "@/lib/lookups";
import { inputClass } from "@/components/ui";

export type DirectoryFilterValues = {
  q: string;
  sort: string;
  session?: number;
  faculty?: number;
  dept?: number;
  centre?: number;
  state?: number;
  position?: number;
};

export type DirectoryFilterLookups = {
  sessions: Option[];
  faculties: Option[];
  departments: Option[];
  studyCentres: Option[];
  states: Option[];
  positions: Option[];
};

const SORTS = [
  ["name_asc", "Name (A–Z)"],
  ["name_desc", "Name (Z–A)"],
  ["newest", "Recently added"],
  ["session", "Latest session"],
] as const;

export default function DirectoryFilterControls({ values, lookups, activeCount }: { values: DirectoryFilterValues; lookups: DirectoryFilterLookups; activeCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Compact phone controls */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] border border-line-strong bg-white text-sm font-bold text-ink"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters
          {activeCount > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">{activeCount}</span>}
        </button>

        <form method="GET" action="/directory">
          <HiddenValues values={values} exclude={["sort"]} />
          <label htmlFor="mobile-sort" className="sr-only">Sort representatives</label>
          <select
            id="mobile-sort"
            name="sort"
            defaultValue={values.sort}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="h-11 w-full rounded-[var(--radius-field)] border border-line-strong bg-white px-3 text-sm font-bold text-ink"
          >
            {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </form>
      </div>

      {/* Desktop filter grid */}
      <form method="GET" action="/directory" className="mt-5 hidden rounded-[var(--radius-card)] border border-line bg-white p-5 sm:block">
        {values.q && <input type="hidden" name="q" value={values.q} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select name="faculty" label="Faculty" value={values.faculty} options={lookups.faculties} />
          <Select name="dept" label="Department" value={values.dept} options={lookups.departments} />
          <Select name="position" label="Position" value={values.position} options={lookups.positions} />
          <Select name="centre" label="Study centre" value={values.centre} options={lookups.studyCentres} />
          <Select name="state" label="State" value={values.state} options={lookups.states} />
          <Select name="session" label="Session" value={values.session} options={lookups.sessions} />
          <Select name="sort" label="Sort by" value={values.sort} options={SORTS.map(([id, name]) => ({ id, name }))} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-field)] bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Apply filters</button>
          {(activeCount > 0 || values.q) && <a href="/directory" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-muted hover:text-accent">Clear all</a>}
        </div>
      </form>

      {/* Phone bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] sm:hidden">
          <button type="button" aria-label="Close filters" onClick={() => setOpen(false)} className="absolute inset-0 bg-brand-ink/45" />
          <div role="dialog" aria-modal="true" aria-labelledby="filter-title" className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 id="filter-title" className="text-base font-bold text-ink">Filter representatives</h2>
                <p className="text-xs text-muted">Narrow the directory to what you need.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-tint text-ink">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form method="GET" action="/directory" className="max-h-[calc(88dvh-69px)] overflow-y-auto px-4 pb-safe pt-4">
              {values.q && <input type="hidden" name="q" value={values.q} />}
              <div className="grid gap-3">
                <Select name="faculty" label="Faculty" value={values.faculty} options={lookups.faculties} />
                <Select name="dept" label="Department" value={values.dept} options={lookups.departments} />
                <Select name="position" label="Position" value={values.position} options={lookups.positions} />
                <Select name="centre" label="Study centre" value={values.centre} options={lookups.studyCentres} />
                <Select name="state" label="State" value={values.state} options={lookups.states} />
                <Select name="session" label="Session" value={values.session} options={lookups.sessions} />
                <Select name="sort" label="Sort by" value={values.sort} options={SORTS.map(([id, name]) => ({ id, name }))} />
              </div>
              <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-line bg-white px-4 py-3 pb-safe">
                {(activeCount > 0 || values.q) && (
                  <a href="/directory" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-field)] border border-line-strong px-4 text-sm font-bold text-ink">Reset</a>
                )}
                <button type="submit" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-field)] bg-brand px-5 text-sm font-bold text-white">Show results</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string | number; options: readonly { id: string | number; name: string }[] }) {
  return (
    <div>
      <label htmlFor={`filter-${name}`} className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</label>
      <select id={`filter-${name}`} name={name} defaultValue={value === undefined ? "" : String(value)} className={inputClass}>
        <option value="">Any</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  );
}

function HiddenValues({ values, exclude = [] }: { values: DirectoryFilterValues; exclude?: (keyof DirectoryFilterValues)[] }) {
  return (
    <>
      {(Object.entries(values) as [keyof DirectoryFilterValues, string | number | undefined][]).map(([key, value]) =>
        value !== undefined && value !== "" && !exclude.includes(key) ? <input key={key} type="hidden" name={key} value={String(value)} /> : null,
      )}
    </>
  );
}
