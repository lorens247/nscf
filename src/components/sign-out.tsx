import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/admin/signout-action";

/** Server action form: signs out without any client-side JavaScript. */
export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-field)] px-3 text-left text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent"
      >
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}
