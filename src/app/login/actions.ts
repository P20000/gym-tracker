"use server";

import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { signJWT } from "@/lib/auth";
import { cookies } from "next/headers";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Creates or updates a user, generates a magic login token,
 * and prints the magic login URL to the terminal console.
 */
export async function sendMagicLink(prevState: unknown, formData: FormData) {
  const rawEmail = formData.get("email") as string;
  const validation = emailSchema.safeParse({ email: rawEmail });

  if (!validation.success) {
    return {
      error: validation.error.flatten().fieldErrors.email?.[0] || "Invalid email",
      success: false,
    };
  }

  const email = validation.data.email.toLowerCase().trim();

  try {
    // Generate secure random token
    const token = crypto.randomUUID();
    const tokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId = existingUser?.id;

    if (existingUser) {
      // Update token on existing user
      await db
        .update(users)
        .set({
          magicToken: token,
          magicTokenExpires: tokenExpires,
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Create new user
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email,
        magicToken: token,
        magicTokenExpires: tokenExpires,
      });
    }

    // Use relative path for bulletproof client navigation across all live Vercel domains
    const magicLink = `/login/verify?token=${token}`;

    // Log the Magic Link prominently in the console for the developer
    console.log("\n" + "═".repeat(80));
    console.log("🔑 [GYM TRACKER] MAGIC LOGIN LINK GENERATED");
    console.log(`✉️  Email: ${email}`);
    console.log(`🔗 Link:  \x1b[36m\x1b[4mhttp://localhost:3000${magicLink}\x1b[0m`);
    console.log("═".repeat(80) + "\n");

    return {
      success: true,
      error: null,
      message: process.env.NODE_ENV === "production"
        ? "Secure verification link generated successfully."
        : "Check your console/terminal for the Magic Link!",
      magicLink,
    };
  } catch (error) {
    console.error("Error in sendMagicLink:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `System Error (${errorMessage}). Please check Vercel environment variables or database tables.`,
    };
  }
}

/**
 * Verifies the login token from the URL, issues a JWT auth cookie,
 * and checks if onboarding (profile creation) is required.
 */
export async function verifyToken(token: string) {
  if (!token) {
    return { success: false, error: "Missing token" };
  }

  try {
    // Find user with token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.magicToken, token))
      .limit(1);

    if (!user) {
      return { success: false, error: "Invalid or expired login link" };
    }

    // Verify token expiration
    if (!user.magicTokenExpires || user.magicTokenExpires < Date.now()) {
      return { success: false, error: "This login link has expired" };
    }

    // Clear token from user record
    await db
      .update(users)
      .set({
        magicToken: null,
        magicTokenExpires: null,
      })
      .where(eq(users.id, user.id));

    // Sign session JWT
    const jwtSession = await signJWT({
      userId: user.id,
      email: user.email,
    });

    // Save session in HTTP-Only secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "gym_auth_token",
      value: jwtSession,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Check if user has an onboarded profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    return {
      success: true,
      onboardingRequired: !profile,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return { success: false, error: "Verification failed due to a system error" };
  }
}
