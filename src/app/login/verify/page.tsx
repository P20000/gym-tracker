import { verifyToken } from "../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Verifying Session | Gym Tracker",
  description: "Processing your secure login request...",
};

interface VerifyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 text-center bg-background">
        <div className="max-w-md p-6 bg-card border border-border rounded-xl shadow-2xl space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-foreground">Missing Verification Token</h1>
          <p className="text-sm text-muted-foreground">
            The login link you clicked appears to be incomplete. Please request a new magic link.
          </p>
          <Link
            href="/login"
            className="touch-target haptic-btn inline-flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg text-sm shadow-md"
          >
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  const result = await verifyToken(token);

  if (result.success) {
    if (result.onboardingRequired) {
      redirect("/onboarding");
    } else {
      redirect("/");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 text-center bg-background">
      <div className="max-w-md p-6 bg-card border border-border rounded-xl shadow-2xl space-y-4">
        <div className="text-red-500 text-4xl">❌</div>
        <h1 className="text-xl font-bold text-foreground">Authentication Failed</h1>
        <p className="text-sm text-muted-foreground">
          {result.error || "The magic link you clicked is invalid or has expired."}
        </p>
        <Link
          href="/login"
          className="touch-target haptic-btn inline-flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg text-sm shadow-md"
        >
          Request a New Link
        </Link>
      </div>
    </main>
  );
}
