# Code Standards

## TypeScript
- Strict typing is mandatory. No `any`.
- Use Zod for schema validation (especially for Server Action inputs).

## UI/UX
- **Mobile First:** The gym environment requires large touch targets and high-contrast text.
- **Components:** Use ShadcnUI primitives. Custom components must be accessible (ARIA).

## Performance
- Favor Server Components for data fetching.
- Use `useOptimistic` for marking sets as complete to provide instant feedback in the gym.
