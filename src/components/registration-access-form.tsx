"use client";

import { useActionState } from "react";
import RepresentativeForm from "@/components/representative-form";
import { Notice, buttonPrimary, inputClass } from "@/components/ui";
import { submitRegistration, unlockRegistration, type AccessState } from "@/app/representatives/join/actions";

export default function RegistrationAccessForm() {
  const [state, action, pending] = useActionState<AccessState, FormData>(unlockRegistration, {});
  if (state.code && state.lookups) {
    return <RepresentativeForm action={submitRegistration} lookups={state.lookups} registrationCode={state.code} submitLabel="Publish my profile" />;
  }
  return (
    <form action={action} className="space-y-5">
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-ink">Access code</label>
        <input id="code" name="code" required maxLength={128} autoComplete="off" spellCheck={false} autoCapitalize="characters" aria-describedby="code-help" className={`${inputClass} font-mono`} />
        <p id="code-help" className="mt-2 text-sm text-muted">Enter the single-use code shared by your administrator. Codes expire after seven days.</p>
      </div>
      <button disabled={pending} className={buttonPrimary}>{pending ? "Checking code…" : "Continue to your details"}</button>
    </form>
  );
}
