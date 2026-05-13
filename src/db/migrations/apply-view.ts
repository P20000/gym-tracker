/**
 * apply-view.ts
 * Run with: npx tsx src/db/migrations/apply-view.ts
 * 
 * Applies the v_strength_progression SQLite view directly to the Turso database.
 * drizzle-kit push does not support views, so this must be run separately.
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function applyView() {
  console.log("Applying v_strength_progression view...");

  await client.execute(`
    CREATE VIEW IF NOT EXISTS v_strength_progression AS
    SELECT 
      id, 
      user_id, 
      exercise_id, 
      weight, 
      reps, 
      (weight * 36.0 / (37.0 - reps)) as e1rm, 
      created_at 
    FROM workout_logs 
    WHERE completed = 1 AND reps < 37 AND reps > 0
  `);

  console.log("✅ v_strength_progression view applied successfully.");
  process.exit(0);
}

applyView().catch((err) => {
  console.error("❌ Failed to apply view:", err);
  process.exit(1);
});
