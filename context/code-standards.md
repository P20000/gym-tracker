# Code Standards

## UI/UX Patterns
- **Optimistic UI:** All workout logs must use `useOptimistic` or TanStack Query `onMutate` to ensure zero latency during sessions.
- **Input Design:** Use `Increment/Decrement` buttons ($2.5kg$ steps) as the primary input, with a secondary numeric field for manual overrides.
- **Charts:** Use Tremor components for all strength-over-time and volume-load diagrams.

## Backend & Database
- **Drizzle Usage:** Use the `@libsql/client` driver with Turso. All queries must be strictly typed.
- **Query Scoping:** Since SQLite lacks native Row Level Security (RLS), every query (`INSERT/SELECT/UPDATE/DELETE`) must be strictly filtered by the active `user_id` at the application level.
- **Performance:** Complex aggregations for Tremor charts should be offloaded to SQLite Views or optimized indexing to keep serverless functions lightweight.