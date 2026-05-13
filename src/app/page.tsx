import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { profiles, templates, instances } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { handleSignOut } from "./actions";
import Link from "next/link";
import HomeDispatcherClient from "./HomeDispatcherClient";

export const metadata = {
  title: "Dashboard | Gym Tracker",
  description: "Your personalized strength and conditioning command center.",
};

export const dynamic = "force-dynamic";

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

  // Check State 3: Active Session exists
  const [activeInstance] = await db
    .select()
    .from(instances)
    .where(and(eq(instances.userId, user.userId), eq(instances.status, "active")))
    .limit(1);

  // Get today's day of week
  const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

  // Check State 2: Plan Exists for today
  const [todayTemplate] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.userId, user.userId), eq(templates.dayOfWeek, todayDay)))
    .limit(1);

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

        <div className="flex items-center space-x-4">
          <Link
            href="/plan"
            className="touch-target haptic-btn px-4 py-2 bg-secondary/80 text-foreground text-xs font-bold rounded-lg border border-border hover:bg-secondary transition-all"
          >
            Weekly Plan
          </Link>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="touch-target haptic-btn px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider rounded-lg border border-border hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main dashboard body */}
      <section className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center py-10 z-10 space-y-10">
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-accent border border-primary/20">
              User Status: Synchronized
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{profile.name}</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg">
              Your serverless SQLite strength stack is live. 
              Review your split and dispatch today&apos;s active session below.
            </p>
          </div>
        </div>

        {/* Smart Dispatcher Engine Area */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Dynamic Workout Dispatcher
          </h3>

          {activeInstance ? (
            /* State 3: Active Session Exists */
            <div className="bg-gradient-to-br from-card to-primary/10 border border-primary/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">
                  🔴 Session In Progress
                </span>
                <h2 className="text-3xl font-black text-foreground tracking-tight mt-2">
                  {activeInstance.name}
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  You have an active workout currently running. Jump back into your session and log your remaining sets.
                </p>
              </div>
              <div>
                <Link
                  href={`/workout/${activeInstance.id}`}
                  className="touch-target haptic-btn inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-extrabold text-base uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25 transition-all"
                >
                  🚀 Resume Workout Session
                </Link>
              </div>
            </div>
          ) : todayTemplate ? (
            /* State 2: Plan Exists for Today */
            <HomeDispatcherClient
              todayDay={todayDay}
              templateId={todayTemplate.id}
              templateName={todayTemplate.name}
              templateDescription={todayTemplate.description}
            />
          ) : (
            /* State 1: No Plan Exists for Today */
            <div className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-md">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-secondary text-muted-foreground border border-border">
                  📅 Today: {todayDay}
                </span>
                <h2 className="text-2xl font-bold text-foreground">No Routine Planned</h2>
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have any workout routines assigned for {todayDay}. Set up your weekly split to automate your daily workout dispatching.
                </p>
              </div>
              <Link
                href="/plan"
                className="touch-target haptic-btn px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center whitespace-nowrap"
              >
                ⚙️ Set Up Weekly Plan
              </Link>
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-5 bg-card border border-border rounded-xl shadow-lg hover:border-primary/20 transition-all duration-300">
            <span className="text-2xl">🏋️‍♂️</span>
            <h3 className="font-bold text-lg text-foreground mt-3">Snapshot Engine</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clones your template into immutable instances with baseline weights from your last completed workout.
            </p>
          </div>

          <div className="p-5 bg-card border border-border rounded-xl shadow-lg hover:border-accent/20 transition-all duration-300">
            <span className="text-2xl">📈</span>
            <h3 className="font-bold text-lg text-foreground mt-3">High-Fidelity Tracking</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated 1-Rep Max (e1RM) and volume metrics are calculated automatically via SQLite views upon completion.
            </p>
          </div>
        </div>

        {/* Developer status panel */}
        <div className="p-4 bg-secondary/50 border border-border rounded-lg text-xs text-muted-foreground font-mono space-y-1">
          <p>🔧 LOCAL CLIENT ENVIRONMENT STATE:</p>
          <p>• Tenant Isolation Key: &quot;{user.userId}&quot;</p>
          <p>• Database Sync Hook: &quot;Turso / Drizzle Core (libSQL)&quot;</p>
          <p>• Active Engine: Dynamic Plan Dispatcher v2</p>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-muted-foreground py-4 z-10 border-t border-border/50 opacity-40 mt-6">
        &copy; {new Date().getFullYear()} Gym Tracker. All training sessions sandboxed securely.
      </footer>
    </main>
  );
}
