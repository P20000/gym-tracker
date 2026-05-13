"use server";

import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { exercises, templates, templateExercises } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toSlug } from "@/lib/parsers/workoutParser";

export type ExistingTemplateConflict = {
  day: string;
  existingId: string;
  existingName: string;
};

export type BulkImportPayload = {
  days: {
    day: string;
    name: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      weight: string;
    }[];
  }[];
  overwriteDays: string[]; // Days the user chose to overwrite (not skip)
};

export async function checkConflictsAction(
  days: string[]
): Promise<ExistingTemplateConflict[]> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const conflicts: ExistingTemplateConflict[] = [];

  for (const day of days) {
    const [existing] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, user.userId), eq(templates.dayOfWeek, day)))
      .limit(1);

    if (existing) {
      conflicts.push({
        day,
        existingId: existing.id,
        existingName: existing.name,
      });
    }
  }

  return conflicts;
}

export async function bulkImportAction(payload: BulkImportPayload): Promise<{
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all existing exercises for slug matching
  const allExercises = await db.select().from(exercises);

  const slugMap = new Map<string, string>(); // slug -> exercise.id
  for (const ex of allExercises) {
    slugMap.set(toSlug(ex.name), ex.id);
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process each day within a transaction
  for (const dayPlan of payload.days) {
    const shouldOverwrite = payload.overwriteDays.includes(dayPlan.day);

    // Check if template already exists for this day
    const [existingTemplate] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, user.userId), eq(templates.dayOfWeek, dayPlan.day)))
      .limit(1);

    if (existingTemplate && !shouldOverwrite) {
      skipped++;
      continue;
    }

    let templateId: string;

    if (existingTemplate && shouldOverwrite) {
      templateId = existingTemplate.id;
      // Update name
      await db
        .update(templates)
        .set({ name: dayPlan.name })
        .where(eq(templates.id, templateId));
      // Delete old exercise links
      await db
        .delete(templateExercises)
        .where(eq(templateExercises.templateId, templateId));
    } else {
      templateId = crypto.randomUUID();
      await db.insert(templates).values({
        id: templateId,
        userId: user.userId,
        name: dayPlan.name,
        dayOfWeek: dayPlan.day,
      });
    }

    // Map exercises to IDs (create new ones if not found by slug)
    for (let i = 0; i < dayPlan.exercises.length; i++) {
      const ex = dayPlan.exercises[i];
      const slug = toSlug(ex.name);
      let exerciseId = slugMap.get(slug);

      if (!exerciseId) {
        // Create new exercise
        exerciseId = crypto.randomUUID();
        await db.insert(exercises).values({
          id: exerciseId,
          userId: user.userId,
          name: ex.name,
          muscleGroup: "Other", // Default — user can edit later
        });
        slugMap.set(slug, exerciseId);
      }

      // Link to template
      await db.insert(templateExercises).values({
        id: crypto.randomUUID(),
        templateId,
        exerciseId,
        sortOrder: i,
      });
    }

    imported++;
  }

  revalidatePath("/");
  revalidatePath("/plan");

  return { success: true, imported, skipped, errors };
}
