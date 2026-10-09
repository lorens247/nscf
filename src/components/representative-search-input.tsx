"use client";

import { useEffect, useId, useState } from "react";

export default function RepresentativeSearchInput({ defaultValue = "", className, placeholder }: { defaultValue?: string; className: string; placeholder: string }) {
  const [query, setQuery] = useState(defaultValue);
  const [result, setResult] = useState<{ query: string; suggestions: { name: string }[] }>({ query: "", suggestions: [] });
  const listId = useId();
  const term = query.trim().slice(0, 80);
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/representatives/suggestions?q=${encodeURIComponent(term)}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ query: term, suggestions: data.suggestions });
      } catch {
        // Normal search remains available if suggestions cannot be loaded.
      }
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [term]);
  return <>
    <input id="q" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoComplete="off" list={listId} className={className} />
    <datalist id={listId}>
      {term.length >= 2 && result.query === term && result.suggestions.map((representative) => <option key={representative.name} value={representative.name} />)}
    </datalist>
  </>;
}
