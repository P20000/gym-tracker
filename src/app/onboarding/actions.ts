"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";

const onboardingSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be less than 50 characters long")
    .trim(),
});

export async function saveOnboardingProfile(prevState: any, formData: FormData) {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "You must be logged in to onboard." };
  }

  const rawName = formData.get("name") as string;
  const validation = onboardingSchema.safeParse({ name: rawName });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors.name?.[0] || "Invalid input",
    };
  }

  const name = validation.data.name;

  try {
    const profileId = crypto.randomUUID();
    await db.insert(profiles).values({
      id: profileId,
      userId: user.userId,
      name,
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Error saving onboarding profile:", error);
    return {
      success: false,
      error: "An unexpected database error occurred. Please try again.",
    };
  }
}
