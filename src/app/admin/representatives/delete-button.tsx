import { Trash2 } from "lucide-react";
import ConfirmForm from "@/components/confirm-form";
import { deleteRepresentative } from "./actions";

export default function DeleteRepresentativeButton({ id, name, iconOnly = false }: { id: number; name: string; iconOnly?: boolean }) {
  return (
    <ConfirmForm action={deleteRepresentative} message={`Permanently delete ${name}? This cannot be undone.`} className="contents">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        className={iconOnly
          ? "flex h-10 w-10 items-center justify-center rounded-[var(--radius-field)] text-accent hover:bg-accent-soft"
          : "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-field)] border border-accent/30 px-3 text-sm font-bold text-accent hover:bg-accent-soft"}
      >
        <Trash2 size={16} aria-hidden="true" />
        {!iconOnly && "Delete"}
      </button>
    </ConfirmForm>
  );
}
