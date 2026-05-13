import { getExercisesAction, getTemplatesAction } from "../workoutActions";
import PlanManagerClient from "./PlanManagerClient";

export const metadata = {
  title: "Plan Manager | Gym Tracker",
  description: "Configure your weekly workout split and assign exercises.",
};

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const exercises = await getExercisesAction();
  const existingTemplates = await getTemplatesAction();

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden p-6">
      {/* Background radial accent layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <PlanManagerClient exercises={exercises} existingTemplates={existingTemplates} />
    </main>
  );
}
