/**
 * workoutParser.ts
 * Parses raw text workout notes into structured day/exercise data.
 * Pure client-side — no external AI or API dependencies.
 */

export type ParsedExercise = {
  name: string;
  sets: number;
  reps: string;      // e.g. "8", "6-8", "10-12"
  weight: string;    // e.g. "60kg", "BW", "20"
  checked: boolean;  // Was it marked [v] or [x] in the source?
  raw: string;       // Original line for debug
};

export type ParsedDay = {
  day: string;       // "Monday", "Tuesday", etc.
  name: string;      // Template name, e.g. "Mon | Delts + Upper Chest"
  exercises: ParsedExercise[];
};

export type ParseResult = {
  days: ParsedDay[];
  totalExercises: number;
  warnings: string[];
};

// Map abbreviated day names → full day names
const DAY_ABBREVIATIONS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// Regex to detect a day header line: "Mon | ..." or "Monday | ..."
const DAY_HEADER_RE = /^(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*\|/i;

// Regex for exercise lines:
// Supports formats like:
//   [v] Bench Press – 4x8 @ 80kg
//   [ ] OHP 3 sets x 10-12 reps @ 60
//   Barbell Row 4x6-8 80kg
//   - Squat: 5x5 @ 100kg
//   [x] Incline DB Press — 3x10 @ 30kg
const EXERCISE_RE =
  /^[\[\-\*\s]*(?:\[([vVxX\s])\])?\s*[-\*]?\s*([A-Za-z][A-Za-z\s\/\(\)&,'.]+?)\s*[–—\-:]?\s*(\d+)\s*(?:x|sets?|X)\s*(\d+(?:[–\-]\d+)?)\s*(?:reps?)?\s*(?:@|at)?\s*([\d.]+\s*(?:kg|lbs?|lb)?|BW|bw|bodyweight)?/i;

// Simpler fallback: "Name – NxM" or "Name Nx M"
const SIMPLE_EXERCISE_RE =
  /^[\[\-\*\s]*(?:\[([vVxX\s])\])?\s*[-\*]?\s*([A-Za-z][A-Za-z\s\/\(\)&,'.]+?)\s+(\d+)\s*[xX]\s*(\d+(?:[–\-–]\d+)?)\s*([\d.]+\s*(?:kg|lbs?)?|BW|bw)?/i;

function normalizeDay(raw: string): string {
  const lower = raw.toLowerCase().slice(0, 3);
  return DAY_ABBREVIATIONS[lower] || raw;
}

function parseExerciseLine(line: string): ParsedExercise | null {
  // Strip leading bullets, numbers, and checkbox artifacts
  const stripped = line
    .replace(/^\s*\d+\.\s*/, "")
    .trim();

  if (!stripped) return null;

  // Try primary pattern first
  let match = EXERCISE_RE.exec(stripped);
  if (!match) {
    match = SIMPLE_EXERCISE_RE.exec(stripped);
  }

  if (!match) return null;

  const checkboxChar = match[1] ?? "";
  const checked = /[vVxX]/.test(checkboxChar);
  const name = match[2].trim().replace(/\s+/g, " ");
  const sets = parseInt(match[3], 10);
  const reps = (match[4] ?? "10").replace("–", "-").replace("—", "-");
  const weight = (match[5] ?? "").trim() || "0";

  // Skip if name is too short (likely a parse artifact)
  if (name.length < 3) return null;

  return {
    name,
    sets: isNaN(sets) ? 3 : sets,
    reps,
    weight,
    checked,
    raw: line,
  };
}

export function parseWorkoutText(rawText: string): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const days: ParsedDay[] = [];
  const warnings: string[] = [];

  let currentDay: ParsedDay | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if this is a day header
    const dayMatch = DAY_HEADER_RE.exec(line);
    if (dayMatch) {
      const dayFull = normalizeDay(dayMatch[1]);
      currentDay = {
        day: dayFull,
        name: line.replace(/[\[\]]/g, "").trim(), // Strip checkbox chars from header
        exercises: [],
      };
      days.push(currentDay);
      continue;
    }

    // Skip lines that are just separators or headers without a current day
    if (/^[-=_#]+$/.test(line)) continue;

    // Try to parse as an exercise
    if (currentDay) {
      const exercise = parseExerciseLine(line);
      if (exercise) {
        currentDay.exercises.push(exercise);
      } else if (line.length > 3 && !/^\/\//.test(line)) {
        // It's a non-empty line we couldn't parse — could be a note
        warnings.push(`Skipped unrecognized line: "${line.slice(0, 60)}"`);
      }
    }
  }

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);

  return { days, totalExercises, warnings };
}

/** Convert an exercise name to a slug for fuzzy DB matching */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
}
