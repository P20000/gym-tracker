import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { handleSignOut } from "./actions";

export const metadata = {
  title: "Dashboard | Gym Tracker",
  description: "Your personalized strength and conditioning command center.",
};

export default async function HomePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.userId))
    .limit(1);

  if (!profile) {
    // If somehow authenticated but onboarding profile is missing
    redirect("/onboarding");
  }

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden p-6">
      {/* Background radial accent layers */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-border z-10">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold tracking-tight text-lg">GYM TRACKER</span>
        </div>

        <form action={handleSignOut}>
          <button
            type="submit"
            className="touch-target haptic-btn px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider rounded-lg border border-border hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Sign Out
          </button>
        </form>
      </header>

      {/* Main dashboard body */}
      <section className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center py-10 z-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-accent border border-primary/20">
              Active Session: Ready
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{profile.name}</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg">
              Your serverless SQLite strength stack is live and fully synchronized. 
              Let's lock in those progression metrics.
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
            <div className="p-5 bg-card border border-border rounded-xl shadow-lg hover:border-primary/20 transition-all duration-300">
              <span className="text-2xl">🏋️‍♂️</span>
              <h3 className="font-bold text-lg text-foreground mt-3">Workout Engine</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Phase 2 is coming next. Prepare your templates and snapshots to record 
                sets with optimistic UI updates.
              </p>
            </div>

            <div className="p-5 bg-card border border-border rounded-xl shadow-lg hover:border-accent/20 transition-all duration-300">
              <span className="text-2xl">📈</span>
              <h3 className="font-bold text-lg text-foreground mt-3">High-Fidelity Tracking</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Phase 3 will render interactive charts mapping your Estimated 1-Rep Max (e1RM) 
                using calculated SQLite Views.
              </p>
            </div>
          </div>

          {/* Developer status panel */}
          <div className="p-4 bg-secondary/50 border border-border rounded-lg text-xs text-muted-foreground font-mono space-y-1">
            <p>🔧 LOCAL CLIENT ENVIRONMENT STATE:</p>
            <p>• Tenant Isolation Key: "{user.userId}"</p>
            <p>• Database Sync Hook: "Turso / Drizzle Core (libSQL)"</p>
            <p>• Node Version: Next.js 15 (Edge Compatible Session Engine)</p>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-muted-foreground py-4 z-10 border-t border-border/50 opacity-40 mt-6">
        &copy; {new Date().getFullYear()} Gym Tracker. All training sessions sandboxed securely.
      </footer>
    </main>
  );
}
