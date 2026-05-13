# Architecture Context

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Deployment:** Vercel (Serverless)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM (preferred for serverless performance) or Prisma.
- **Auth:** Supabase Auth.
- **Styling:** Tailwind CSS + ShadcnUI.

## Data Flow
- **Server Actions:** All DB mutations (logging sets, updating protein) must happen via Server Actions.
- **Edge Runtime:** Analytics and strength calculations should favor the Edge runtime for low latency.
