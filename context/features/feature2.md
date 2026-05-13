# Feature 2: Workout Engine & Dynamic Plan Dispatcher

## 1. Objective
Implement a multi-tenant system to define weekly workout plans (Templates) and a homepage engine that dispatches the correct "Active Session" based on the current day.

## 2. Technical Logic: The "Snapshot" Workflow
1. **The Plan:** User defines a `Template` for each `dayOfWeek` (Monday-Sunday).
2. **The Dispatcher:** The Homepage (`/`) detects the current system day.
3. **The Snapshot:** When "Start Workout" is clicked, the system clones the `Template` and its associated `Exercises` into a `WorkoutInstance`.
4. **Immutability:** Once the `WorkoutInstance` is created, changes to the `Template` must not affect the active session.

## 3. Database Schema Updates (Turso/Drizzle)
Update `src/db/schema.ts` to include:
- **templates:** Add `dayOfWeek: text` (enum: Monday-Sunday).
- **template_exercises:** Junction table linking `templates` to `exercises` with a `sortOrder` column.
- **workout_instances:** Add `status: text` ('active', 'completed', 'cancelled').
- **workout_logs:** Ensure these link to `workout_instances` for the snapshot data.

## 4. Tasks for Agent

### Task A: The Plan Manager (`/plan`)
- Build a mobile-optimized interface to assign exercises to specific days.
- **UI:** 7-day horizontal tabs.
- **UX:** A searchable list of exercises to add to the day. Use simple "Up/Down" arrows for reordering (Mobile-friendly alternative to drag-and-drop).
- **Server Action:** `saveTemplateAction` to persist the plan.

### Task B: The Smart Homepage Dispatcher (`/`)
- **Query:** Fetch the `Template` assigned to `Intl.DateTimeFormat('en-US', { weekday: 'long' })`.
- **State 1 (No Plan):** Show a CTA to "Set up your workout plan" if the day is empty.
- **State 2 (Plan Exists):** Show the Plan Name (e.g., "Mon | Delts + Upper Chest") and a "Start Session" button.
- **State 3 (Active Session):** If a `WorkoutInstance` is currently 'active', redirect or show the "Resume Workout" UI immediately.

### Task C: The Snapshot Engine (Server Action)
- Create `startWorkoutSession(templateId)`:
    1. Query the `template_exercises`.
    2. Create a new `workout_instance`.
    3. Bulk insert rows into `workout_logs` based on the template's exercises.
    4. **Persistence:** Pull the 'Weight' and 'Reps' from the *most recent* completed instance of each exercise as placeholder values (Progressive Overload baseline).

## 5. UI/UX Constraints
- **Zero Latency:** Use `useTransition` for the "Start Session" button to show a loading state while the snapshot is being generated in Turso.
- **Mobile First:** All exercise selection lists must have large touch targets (min 48px).