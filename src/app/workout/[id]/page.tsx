import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { instances, workoutLogs, exercises } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import WorkoutSessionClient from "./WorkoutSessionClient";

export const metadata = {
  title: "Active Workout | Gym Tracker",
  description: "Live session tracking with progressive overload baselines.",
};

export const dynamic = "force-dynamic";

export default async function WorkoutPage(props: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await props.params;
  const { id } = params;

  // Fetch instance
  const [instance] = await db
    .select()
    .from(instances)
    .where(and(eq(instances.id, id), eq(instances.userId, user.userId)))
    .limit(1);

  if (!instance) {
    redirect("/");
  }

  // Fetch logs joined with exercises
  const rawLogs = await db
    .select({
      id: workoutLogs.id,
      setIndex: workoutLogs.setIndex,
      weight: workoutLogs.weight,
      reps: workoutLogs.reps,
      completed: workoutLogs.completed,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(workoutLogs)
    .innerJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
    .where(and(eq(workoutLogs.instanceId, id), eq(workoutLogs.userId, user.userId)))
    .orderBy(asc(workoutLogs.setIndex));

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden p-6">
      {/* Background radial accent layers */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[150px] pointer-events-none" />
      <WorkoutSessionClient instance={instance} initialLogs={rawLogs} />
    </main>
  );
}
