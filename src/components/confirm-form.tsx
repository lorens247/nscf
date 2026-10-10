"use client";

import type { ReactNode } from "react";

/** A form that asks for confirmation before submitting a server action. */
export default function ConfirmForm({
  action,
  message,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={async (formData) => {
        if (!window.confirm(message)) return;
        await action(formData);
      }}
      className={className}
    >
      {children}
    </form>
  );
}
