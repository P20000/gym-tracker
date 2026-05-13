# Feature 3: High-Performance Regex Plan Ingestion

## 1. Objective
Implement a client-side parser to convert raw text workout notes into structured Turso database records without external AI dependencies.

## 2. Implementation Specs

### Task A: The Parser Utility (`src/lib/parsers/workoutParser.ts`)
Create a function `parseWorkoutText(rawText: string)` that returns a structured JSON object.
- **Day Detection:** Split text by `Mon |`, `Tue |`, etc.
- **Exercise Extraction:** Use Regex to identify:
  - Exercise Name
  - Sets (Integer)
  - Reps (String to allow ranges like 6-8)
  - Initial Weight (String)
- **Edge Case Handling:** Ignore empty lines, handle [v] and [ ] checkboxes, and capture the "Priority" or "Detail" tags in the template names.

### Task B: The Ingestion UI (`/plan/import`)
- **Input:** A `Textarea` for the raw dump.
- **Preview:** A "Review & Confirm" step using a Shadcn/Tremor table that shows the parsed data before the DB write.
- **Action:** A `bulkImportAction` that:
  1. Checks for existing exercises in the `exercises` table (slug-based matching).
  2. Creates `templates` for each detected day.
  3. Maps `template_exercises` with correct sort order.

### Task C: Transactional Integrity
- Use `db.transaction()` in the Server Action. 
- **Constraint:** If the user already has a template for "Monday," provide a toggle to "Overwrite" or "Skip."

## 3. UI/UX Rules
- **Instant Validation:** Run the regex on `onChange` of the textarea to show a "Valid/Invalid" count of exercises detected in real-time.
- **Mobile First:** Ensure the "Review Table" is horizontally scrollable.