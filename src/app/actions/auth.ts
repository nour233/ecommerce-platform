"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

/** Ends the current signed-in session from a server-rendered form action. */
export async function logoutAction() {
  await clearSession();
  redirect("/");
}
