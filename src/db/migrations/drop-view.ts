/**
 * drop-view.ts
 * Drops the v_strength_progression view so drizzle-kit push can run cleanly.
 * Run: export $(grep -v '^#' .env | xargs) && npx tsx src/db/migrations/drop-view.ts
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Dropping v_strength_progression view...");
  await client.execute("DROP VIEW IF EXISTS v_strength_progression");
  console.log("✅ View dropped.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
