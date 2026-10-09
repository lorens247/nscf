"use server";

import { signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirect: false });
  // Redirect manually so the destination is not inferred from the referer host.
  const { redirect } = await import("next/navigation");
  redirect("/admin/login");
}
