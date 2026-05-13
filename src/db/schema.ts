import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. Users Table (Handles local JWT session/magic link verification)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  magicToken: text("magic_token"),
  magicTokenExpires: integer("magic_token_expires"), // Milliseconds timestamp
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 2. Profiles Table (Holds customizable user settings & details)
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  updatedAt: integer("updated_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 3. Templates Table (Workout routines defined by users, e.g., "Push Day A")
export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  dayOfWeek: text("day_of_week"), // 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 4. Workout Instances Table (Active / Finished sessions cloned from Templates)
export const instances = sqliteTable("instances", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => templates.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(), // Cloned from template or custom named
  status: text("status").notNull().default("active"), // "active" | "completed"
  completedAt: integer("completed_at"), // Nullable until marked completed
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 5. Exercises Table (Global list + user-defined custom exercises)
export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // Null means global default
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(), // e.g., "Chest", "Delts", "Back", "Legs"
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 5b. Template Exercises Table (Junction linking templates to exercises with sortOrder)
// Defined after exercises to avoid forward reference
export const templateExercises = sqliteTable("template_exercises", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .references(() => templates.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 6. Workout Logs Table (Set-by-set weight and rep records inside an Instance)
export const workoutLogs = sqliteTable("workout_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  instanceId: text("instance_id")
    .notNull()
    .references(() => instances.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  setIndex: integer("set_index").notNull(), // 0, 1, 2 for tracking set order
  weight: real("weight").notNull(), // In kg
  reps: integer("reps").notNull(),
  completed: integer("completed").notNull().default(0), // SQLite uses integer 0 / 1 for booleans
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// 7. Protein Logs Table (Personalized nutrition totals tracking Paneer, Tofu, etc.)
export const proteinLogs = sqliteTable("protein_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // e.g., "Paneer", "Tofu", "Milk"
  amountGrams: integer("amount_grams").notNull(), // Portion in grams
  proteinGrams: real("protein_grams").notNull(), // Actual protein weight
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now') * 1000)`),
});

// NOTE: The v_strength_progression SQLite view is applied directly via raw SQL
// (see src/db/migrations/apply-view.ts) because drizzle-kit push does not support views.

