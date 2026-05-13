"use server";

import { logoutUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function handleSignOut() {
  await logoutUser();
  redirect("/login");
}
