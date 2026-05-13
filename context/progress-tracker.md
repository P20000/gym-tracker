# Progress Tracker

## Phase 1: Database & Auth [x]
- [x] Initialize Turso Database & Auth (Clerk/Auth.js).
- [x] Define Drizzle Schemas (Users, Templates, Instances, Exercises) using SQLite/libSQL types.
- [x] Create SQLite Database View for e1RM calculations.

## Phase 2: Workout Engine [x]
- [x] Implement Template-to-Snapshot cloning logic.
- [x] Build the "Increment/Decrement" logging component.
- [x] Implement Optimistic Updates for set completion.

## Phase 3: Regex Plan Ingestion [x]
- [x] Build `workoutParser.ts` regex utility (day detection, exercise extraction, checkbox handling).
- [x] Create `/plan/import` page with 3-step flow (Input → Review → Done).
- [x] Implement `bulkImportAction` with slug-based exercise matching and overwrite/skip conflict resolution.
- [x] Add live validation counter and horizontally scrollable review table.

## Phase 4: Tremor Dashboards [ ]
- [ ] Create Muscle Group Volume Chart.
- [ ] Create e1RM Progression Line Graph.