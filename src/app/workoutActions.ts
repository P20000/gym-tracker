"use server";

import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { templates, templateExercises, exercises, instances, workoutLogs } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper to seed default exercises if none exist
async function ensureDefaultExercises(userId: string) {
  const existing = await db.select().from(exercises).limit(1);
  if (existing.length === 0) {
    const defaultList = [
      { id: crypto.randomUUID(), name: "Barbell Bench Press", muscleGroup: "Chest", userId: undefined },
      { id: crypto.randomUUID(), name: "Incline Dumbbell Press", muscleGroup: "Chest", userId: undefined },
      { id: crypto.randomUUID(), name: "Barbell Squat", muscleGroup: "Legs", userId: undefined },
      { id: crypto.randomUUID(), name: "Romanian Deadlift", muscleGroup: "Legs", userId: undefined },
      { id: crypto.randomUUID(), name: "Lat Pulldown", muscleGroup: "Back", userId: undefined },
      { id: crypto.randomUUID(), name: "Barbell Row", muscleGroup: "Back", userId: undefined },
      { id: crypto.randomUUID(), name: "Overhead Shoulder Press", muscleGroup: "Delts", userId: undefined },
      { id: crypto.randomUUID(), name: "Dumbbell Lateral Raise", muscleGroup: "Delts", userId: undefined },
      { id: crypto.randomUUID(), name: "Barbell Bicep Curl", muscleGroup: "Arms", userId: undefined },
      { id: crypto.randomUUID(), name: "Tricep Rope Pushdown", muscleGroup: "Arms", userId: undefined },
    ];
    for (const ex of defaultList) {
      await db.insert(exercises).values(ex);
    }
  }
}

export async function getExercisesAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  await ensureDefaultExercises(user.userId);
  return await db.select().from(exercises).orderBy(asc(exercises.name));
}

export async function getTemplatesAction() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const userTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.userId, user.userId));

  const allTemplateExercises = await db.select().from(templateExercises);

  return userTemplates.map((t) => ({
    ...t,
    exercises: allTemplateExercises
      .filter((te) => te.templateId === t.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export async function saveTemplateAction(
  dayOfWeek: string,
  name: string,
  description: string,
  exerciseIds: string[]
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Check if template already exists for this day and user
  const existingTemplates = await db
    .select()
    .from(templates)
    .where(and(eq(templates.userId, user.userId), eq(templates.dayOfWeek, dayOfWeek)))
    .limit(1);

  let templateId = "";

  if (existingTemplates.length > 0) {
    templateId = existingTemplates[0].id;
    // Update name and description
    await db
      .update(templates)
      .set({ name, description })
      .where(eq(templates.id, templateId));

    // Clear existing exercise links
    await db.delete(templateExercises).where(eq(templateExercises.templateId, templateId));
  } else {
    templateId = crypto.randomUUID();
    await db.insert(templates).values({
      id: templateId,
      userId: user.userId,
      name,
      description,
      dayOfWeek,
    });
  }

  // Insert new exercise links with sortOrder
  for (let i = 0; i < exerciseIds.length; i++) {
    await db.insert(templateExercises).values({
      id: crypto.randomUUID(),
      templateId,
      exerciseId: exerciseIds[i],
      sortOrder: i,
    });
  }

  revalidatePath("/");
  revalidatePath("/plan");
  return { success: true, templateId };
}

export async function startWorkoutSessionAction(templateId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch template
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!template) throw new Error("Template not found");

  // Fetch exercises for template
  const templateExs = await db
    .select()
    .from(templateExercises)
    .where(eq(templateExercises.templateId, templateId))
    .orderBy(asc(templateExercises.sortOrder));

  if (templateExs.length === 0) {
    throw new Error("No exercises found in template");
  }

  const instanceId = crypto.randomUUID();

  // Create WorkoutInstance
  await db.insert(instances).values({
    id: instanceId,
    userId: user.userId,
    templateId: template.id,
    name: template.name,
    status: "active",
  });

  // Populate workout_logs
  for (const te of templateExs) {
    // Find most recent completed set for this exercise to use as baseline
    const [lastLog] = await db
      .select()
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, user.userId),
          eq(workoutLogs.exerciseId, te.exerciseId),
          eq(workoutLogs.completed, 1)
        )
      )
      .orderBy(desc(workoutLogs.createdAt))
      .limit(1);

    const baselineWeight = lastLog ? lastLog.weight : 20;
    const baselineReps = lastLog ? lastLog.reps : 10;

    // Create 3 sets for each exercise
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      await db.insert(workoutLogs).values({
        id: crypto.randomUUID(),
        userId: user.userId,
        instanceId,
        exerciseId: te.exerciseId,
        setIndex,
        weight: baselineWeight,
        reps: baselineReps,
        completed: 0,
      });
    }
  }

  revalidatePath("/");
  redirect(`/workout/${instanceId}`);
}

export async function updateSetLogAction(
  logId: string,
  weight: number,
  reps: number,
  completed: number
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(workoutLogs)
    .set({ weight, reps, completed })
    .where(and(eq(workoutLogs.id, logId), eq(workoutLogs.userId, user.userId)));

  revalidatePath("/workout/[id]", "page");
  return { success: true };
}

export async function completeWorkoutInstanceAction(instanceId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(instances)
    .set({ status: "completed", completedAt: Date.now() })
    .where(and(eq(instances.id, instanceId), eq(instances.userId, user.userId)));

  revalidatePath("/");
  redirect("/");
}

export async function cancelWorkoutInstanceAction(instanceId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(instances)
    .set({ status: "cancelled" })
    .where(and(eq(instances.id, instanceId), eq(instances.userId, user.userId)));

  revalidatePath("/");
  redirect("/");
}
