"use client";

import { useActionState, useId, useState } from "react";
import { createInvitation, type InvitationState } from "@/app/admin/invitations/actions";
import { Notice, buttonPrimary, buttonSecondary, inputClass } from "@/components/ui";

export default function InvitationGenerator() {
  const [state, action, pending] = useActionState<InvitationState, FormData>(createInvitation, {});
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState(false);
  const quantityId = useId();
  const batchKey = state.codes?.map((item) => item.id).join(",") ?? "";
  async function copy(code?: string) {
    if (!state.codes?.length) return;
    try {
      const text = code
        ? `Register your representative profile: ${window.location.origin}/representatives/join\nAccess code: ${code}`
        : `Registration page: ${window.location.origin}/representatives/join\n${state.codes.map((item) => item.code).join("\n")}`;
      await navigator.clipboard.writeText(text);
      setCopied(code ?? batchKey);
      setCopyError(false);
    } catch { setCopyError(true); }
  }
  function download() {
    if (!state.codes?.length) return;
    const rows = ["Invitation ID,Access code,Registration URL,Expires at (UTC)", ...state.codes.map((item) => `${item.id},${item.code},${window.location.origin}/representatives/join,${state.expiresAt}`)];
    const url = URL.createObjectURL(new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `rep-codes-${state.codes[0].id}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-white p-5">
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor={quantityId} className="block text-sm font-semibold text-ink">Number of codes</label>
        <input id={quantityId} name="quantity" type="number" min={1} max={100} step={1} defaultValue={1} required className={`${inputClass} max-w-32`} aria-describedby={`${quantityId}-help`} />
      </div>
      <button disabled={pending} className={buttonPrimary}>{pending ? "Creating…" : "Generate access codes"}</button>
      <p id={`${quantityId}-help`} className="w-full text-xs text-muted">Generate 1–100 codes at a time. Each 10-character code is valid for one representative.</p>
    </form>
    {state.error && <Notice tone="error">{state.error}</Notice>}
    {!!state.codes?.length && <div className="space-y-3">
      <Notice tone="success">Generated {state.codes.length} {state.codes.length === 1 ? "code" : "codes"}. Copy or download them before leaving; original codes cannot be retrieved later.</Notice>
      <p className="text-sm text-muted">Share one code privately with each representative. Registration page: <span className="font-mono">/representatives/join</span></p>
      <p className="text-xs text-muted">Expires: {new Date(state.expiresAt!).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (Lagos time).</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy()} className={buttonSecondary}>{copied === batchKey ? "Copied all" : "Copy all codes"}</button>
        <button type="button" onClick={download} className={buttonSecondary}>Download CSV</button>
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto rounded-[var(--radius-field)] border border-line p-3">
        {state.codes.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0 last:pb-0">
          <div><span className="mr-3 text-xs text-muted">#{item.id}</span><code className="font-mono text-lg font-bold tracking-wider text-brand">{item.code}</code></div>
          <button type="button" onClick={() => copy(item.code)} className={buttonSecondary} aria-label={`Copy code ${item.code} and registration link`}>{copied === item.code ? "Copied" : "Copy"}</button>
        </li>)}
      </ul>
      {copyError && <Notice tone="info">Copy the codes manually or download the CSV instead.</Notice>}
    </div>}
  </div>;
}
