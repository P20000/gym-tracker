import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export const metadata = {
  title: "Onboarding | Gym Tracker",
  description: "Set up your workout analytics profile.",
};

export default async function OnboardingPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Double check if they already have a profile
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.userId))
    .limit(1);

  if (existingProfile) {
    redirect("/");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 relative overflow-hidden bg-background">
      {/* Background glow ambient layers */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full flex justify-center">
        <OnboardingForm />
      </div>
    </main>
  );
}
