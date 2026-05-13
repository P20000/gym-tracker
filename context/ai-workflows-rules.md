# AI Workflow Rules

## Exercise Logic
1. **Mapping Alternatives:** If a user requests an alternative, refer to the internal static mapping:
   - Flat Bench -> Chest Press Machine / DB Flat Bench
   - Barbell Row -> Chest-Supported Row / Seated Cable Row
   - Squat -> Hack Squat / Leg Press
2. **Progression Analysis:** When analyzing "Scope of Improvement," compare the e1RM of the current snapshot against the previous instance of the same template.

## State Transitions
- **Session Lifecycle:** `Template` -> `Active Session` (Optimistic) -> `Snapshot` (DB Write).