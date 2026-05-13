# Architecture Context

## Tech Stack
- **Framework:** Next.js 15 (App Router).
- **Database:** Turso (libSQL/SQLite serverless database).
- **Auth:** Clerk or Auth.js (NextAuth) for secure, serverless-optimized user sessions.
- **ORM:** Drizzle ORM (Serverless optimized).
- **State Management:** TanStack Query (React Query) for optimistic UI updates.
- **UI:** Tailwind CSS + ShadcnUI + Tremor for analytics.

## Data Modeling Strategy
- **Multi-tenancy:** Every table contains a `user_id` text column, and all queries are strictly filtered at the application level by this authenticated user ID.
- **Snapshot Pattern:** When a user starts a workout, the application clones the `Template` data into a `WorkoutInstance` table. This prevents future template changes from corrupting historical data.
- **Progression Logic:** Use a Database View (`v_strength_progression`) to calculate e1RM using the Brzycki Formula: $Weight \times (36 / (37 - Reps))$.

## Infrastructure
- **Deployment:** Vercel (Serverless functions).
- **Database Migrations:** Managed via Drizzle-kit pushing to Turso.