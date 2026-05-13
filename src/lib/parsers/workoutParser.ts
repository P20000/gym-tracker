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

// Primary exercise regex.
// Supports Unicode dashes (\u2013 en-dash, \u2014 em-dash) in the reps group.
// x/X separator is case-insensitive via the /i flag.
// Weight group handles: "80kg", "0kg", "base 10kg", "30", "BW"
const EXERCISE_RE =
  /^[\[\-\*\s]*(?:\[([vVxX\s])\])?\s*[-\*]?\s*([A-Za-z][A-Za-z\s\/\(\)&,'.]+?)\s*[\u2013\u2014\-:]?\s*(\d+)\s*(?:sets?|x)\s*(\d+(?:[\u2013\u2014\-]\d+)?)\s*(?:reps?)?\s*(?:@|at)?\s*((?:base\s+)?[\d.]+\s*(?:kg|lbs?|lb)?|BW|bw|bodyweight)?/i;

// Simpler fallback: "Name NxM" or "Name N x M"
const SIMPLE_EXERCISE_RE =
  /^[\[\-\*\s]*(?:\[([vVxX\s])\])?\s*[-\*]?\s*([A-Za-z][A-Za-z\s\/\(\)&,'.]+?)\s+(\d+)\s*x\s*(\d+(?:[\u2013\u2014\-]\d+)?)\s*((?:base\s+)?[\d.]+\s*(?:kg|lbs?)?|BW|bw)?/i;

// Last-resort fallback: capture the entire line as an exercise name.
// Used when both primary and simple regexes fail but the line looks like
// an exercise name (starts with an optional checkbox then a word).
const ACTIVITY_RE =
  /^[\[\-\*\s]*(?:\[([vVxX\s])\])?\s*[-\*]?\s*([A-Za-z][A-Za-z\s\/\(\)&,'.–0-9]+)$/i;

function normalizeDay(raw: string): string {
  const lower = raw.toLowerCase().slice(0, 3);
  return DAY_ABBREVIATIONS[lower] || raw;
}

function parseExerciseLine(line: string): ParsedExercise | null {
  // .trim() each line to eliminate invisible whitespace before any regex test
  const stripped = line
    .replace(/^\s*\d+\.\s*/, "") // strip leading "1. "
    .trim();

  if (!stripped) return null;

  // ── Primary pattern ──────────────────────────────────────────────────────
  let match = EXERCISE_RE.exec(stripped);

  if (match) {
    const checkboxChar = match[1] ?? "";
    const checked = /[vVxX]/.test(checkboxChar);
    const name = match[2].trim().replace(/\s+/g, " ");
    const sets = parseInt(match[3], 10);
    // Normalise all dash variants to ASCII hyphen in reps
    const reps = (match[4] ?? "10")
      .replace(/\u2013|\u2014/g, "-")
      .replace("—", "-")
      .replace("–", "-");
    // Weight: strip optional "base " prefix, keep the numeric+unit part
    const rawWeight = (match[5] ?? "").trim().replace(/^base\s+/i, "");
    const weight = rawWeight || "0";

    if (name.length < 3) return null;
    return { name, sets: isNaN(sets) ? 3 : sets, reps, weight, checked, raw: line };
  }

  // ── Simple fallback pattern ───────────────────────────────────────────────
  match = SIMPLE_EXERCISE_RE.exec(stripped);

  if (match) {
    const checkboxChar = match[1] ?? "";
    const checked = /[vVxX]/.test(checkboxChar);
    const name = match[2].trim().replace(/\s+/g, " ");
    const sets = parseInt(match[3], 10);
    const reps = (match[4] ?? "10").replace(/\u2013|\u2014/g, "-");
    const rawWeight = (match[5] ?? "").trim().replace(/^base\s+/i, "");
    const weight = rawWeight || "0";

    if (name.length < 3) return null;
    return { name, sets: isNaN(sets) ? 3 : sets, reps, weight, checked, raw: line };
  }

  // ── Activity fallback ─────────────────────────────────────────────────────
  // CRITICAL: If both structured regexes fail, capture the whole line as the
  // exercise name with default sets: 1 and reps: "1".
  const activityMatch = ACTIVITY_RE.exec(stripped);
  if (activityMatch) {
    const checkboxChar = activityMatch[1] ?? "";
    const checked = /[vVxX]/.test(checkboxChar);
    const name = activityMatch[2].trim().replace(/\s+/g, " ");
    if (name.length < 3) return null;
    return { name, sets: 1, reps: "1", weight: "0", checked, raw: line };
  }

  return null;
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
