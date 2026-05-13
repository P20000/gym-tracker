"use client";

import { useState, useTransition } from "react";
import { parseWorkoutText, type ParseResult, type ParsedDay } from "@/lib/parsers/workoutParser";
import {
  checkConflictsAction,
  bulkImportAction,
  type ExistingTemplateConflict,
} from "./importActions";
import Link from "next/link";

type Step = "input" | "review" | "done";

export default function ImportPageClient() {
  const [step, setStep] = useState<Step>("input");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [conflicts, setConflicts] = useState<ExistingTemplateConflict[]>([]);
  const [overwriteDays, setOverwriteDays] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Live parse on every keypress
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    if (text.trim()) {
      setParsed(parseWorkoutText(text));
    } else {
      setParsed(null);
    }
  };

  const handleReview = () => {
    if (!parsed || parsed.days.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const detectedConflicts = await checkConflictsAction(
          parsed.days.map((d) => d.day)
        );
        setConflicts(detectedConflicts);
        // Default: skip all conflicts
        setOverwriteDays(new Set());
        setStep("review");
      } catch (err) {
        setError("Failed to check for conflicts. Please try again.");
      }
    });
  };

  const handleImport = () => {
    if (!parsed) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await bulkImportAction({
          days: parsed.days.map((d) => ({
            day: d.day,
            name: d.name,
            exercises: d.exercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
            })),
          })),
          overwriteDays: Array.from(overwriteDays),
        });
        setImportResult({ imported: result.imported, skipped: result.skipped });
        setStep("done");
      } catch (err) {
        setError("Import failed. Please try again.");
      }
    });
  };

  const toggleOverwrite = (day: string) => {
    setOverwriteDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const hasConflict = (day: string) => conflicts.some((c) => c.day === day);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 z-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Bulk Import Workout Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Paste your raw workout notes — the parser will extract days and exercises automatically.
          </p>
        </div>
        <Link
          href="/plan"
          className="touch-target haptic-btn px-4 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border hover:bg-secondary/80 transition-all whitespace-nowrap"
        >
          ← Back to Plan
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-wider">
        {(["input", "review", "done"] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full border transition-all ${
                step === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : idx < ["input", "review", "done"].indexOf(step)
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {idx < 2 && <span className="text-border">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ─── STEP 1: INPUT ─── */}
      {step === "input" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Raw Workout Notes</h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Paste your notes in any format. Example:
                </p>
              </div>
              {parsed && (
                <div className="flex items-center space-x-3">
                  {parsed.totalExercises > 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      ✓ {parsed.totalExercises} exercises across {parsed.days.length} days
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      ⚠ No exercises detected yet
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Example format hint */}
            <div className="bg-secondary/30 border border-dashed border-border rounded-xl p-4 font-mono text-xs text-muted-foreground space-y-1">
              <p className="text-accent font-bold mb-2">Supported format examples:</p>
              <p>Mon | Chest + Triceps</p>
              <p>{"  "}[v] Bench Press – 4x8 @ 80kg</p>
              <p>{"  "}[ ] Incline DB Press 3x10-12 60kg</p>
              <p>Wed | Back Day</p>
              <p>{"  "}Barbell Row 4x6-8 @ 70kg</p>
            </div>

            <textarea
              value={rawText}
              onChange={handleTextChange}
              className="w-full h-72 bg-input text-foreground font-mono text-sm p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-y placeholder:text-muted-foreground/50"
              placeholder="Mon | Push Day A&#10;  [v] Bench Press – 4x8 @ 80kg&#10;  [ ] Incline DB Press 3x10-12 60kg&#10;&#10;Wed | Back Day&#10;  Barbell Row 4x6 @ 70kg&#10;  Lat Pulldown 3x10-12"
              spellCheck={false}
            />

            {/* Live parsed preview summary */}
            {parsed && parsed.days.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Preview
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsed.days.map((d) => (
                    <div
                      key={d.day}
                      className="flex items-center space-x-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl"
                    >
                      <span className="text-xs font-bold text-primary">{d.day}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {d.exercises.length} exercises
                      </span>
                    </div>
                  ))}
                </div>
                {parsed.warnings.length > 0 && (
                  <div className="text-xs text-yellow-400/80 space-y-1">
                    {parsed.warnings.slice(0, 3).map((w, i) => (
                      <p key={i}>⚠ {w}</p>
                    ))}
                    {parsed.warnings.length > 3 && (
                      <p>...and {parsed.warnings.length - 3} more warnings</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleReview}
              disabled={!parsed || parsed.days.length === 0 || isPending}
              className="touch-target haptic-btn w-full py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              {isPending ? "Checking for conflicts..." : "Review & Confirm →"}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: REVIEW ─── */}
      {step === "review" && parsed && (
        <div className="space-y-6">
          {/* Conflict Resolution Panel */}
          {conflicts.length > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h2 className="text-lg font-bold text-yellow-400">Existing Templates Detected</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose to overwrite or skip each conflicting day.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {conflicts.map((c) => (
                  <div
                    key={c.day}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-sm text-foreground">{c.day}</p>
                      <p className="text-xs text-muted-foreground">
                        Existing: &quot;{c.existingName}&quot;
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOverwriteDays((prev) => {
                            const next = new Set(prev);
                            next.delete(c.day);
                            return next;
                          });
                        }}
                        className={`touch-target px-4 py-2 rounded-lg font-bold text-xs uppercase border transition-all ${
                          !overwriteDays.has(c.day)
                            ? "bg-secondary text-foreground border-border"
                            : "bg-card text-muted-foreground border-border/50"
                        }`}
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOverwrite(c.day)}
                        className={`touch-target px-4 py-2 rounded-lg font-bold text-xs uppercase border transition-all ${
                          overwriteDays.has(c.day)
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-card text-muted-foreground border-border/50"
                        }`}
                      >
                        Overwrite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Table for each day */}
          <div className="space-y-6">
            {parsed.days.map((dayPlan) => (
              <DayReviewCard
                key={dayPlan.day}
                dayPlan={dayPlan}
                isConflict={hasConflict(dayPlan.day)}
                isOverwriting={overwriteDays.has(dayPlan.day)}
                isSkipping={hasConflict(dayPlan.day) && !overwriteDays.has(dayPlan.day)}
              />
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="touch-target haptic-btn px-6 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm rounded-xl border border-border transition-all"
            >
              ← Edit Input
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isPending}
              className="touch-target haptic-btn flex-1 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
            >
              {isPending
                ? "⚡ Importing..."
                : `🚀 Confirm Import (${parsed.days.length - (conflicts.length - overwriteDays.size)} days)`}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: DONE ─── */}
      {step === "done" && importResult && (
        <div className="text-center space-y-8 py-12">
          <div className="space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-black text-foreground">Import Complete!</h2>
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <p className="text-4xl font-black text-primary">{importResult.imported}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">
                  Days Imported
                </p>
              </div>
              {importResult.skipped > 0 && (
                <div className="text-center">
                  <p className="text-4xl font-black text-muted-foreground">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    Days Skipped
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/plan"
              className="touch-target haptic-btn px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 transition-all"
            >
              → View Weekly Plan
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setRawText("");
                setParsed(null);
                setImportResult(null);
                setConflicts([]);
              }}
              className="touch-target haptic-btn px-6 py-4 bg-secondary text-foreground font-bold text-sm rounded-xl border border-border hover:bg-secondary/80 transition-all"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Day Review Card ───
function DayReviewCard({
  dayPlan,
  isConflict,
  isOverwriting,
  isSkipping,
}: {
  dayPlan: ParsedDay;
  isConflict: boolean;
  isOverwriting: boolean;
  isSkipping: boolean;
}) {
  const statusBadge = isSkipping
    ? { label: "Will Skip", cls: "bg-secondary text-muted-foreground border-border" }
    : isOverwriting
    ? { label: "Will Overwrite", cls: "bg-red-500/10 text-red-400 border-red-500/20" }
    : { label: "Will Create", cls: "bg-green-500/10 text-green-400 border-green-500/20" };

  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden transition-all ${
        isSkipping ? "border-border/40 opacity-50" : "border-border shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/20">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-extrabold text-foreground">{dayPlan.day}</h3>
          <span className="text-xs text-muted-foreground">{dayPlan.name}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.cls}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Horizontally scrollable table — mobile-first */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Exercise</th>
              <th className="px-6 py-3 text-center">Sets</th>
              <th className="px-6 py-3 text-center">Reps</th>
              <th className="px-6 py-3 text-center">Weight</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {dayPlan.exercises.map((ex, i) => (
              <tr
                key={i}
                className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
              >
                <td className="px-6 py-3 text-muted-foreground font-mono text-xs">
                  {i + 1}
                </td>
                <td className="px-6 py-3">
                  <span className="font-bold text-foreground">{ex.name}</span>
                </td>
                <td className="px-6 py-3 text-center font-mono text-foreground">
                  {ex.sets}
                </td>
                <td className="px-6 py-3 text-center font-mono text-foreground">
                  {ex.reps}
                </td>
                <td className="px-6 py-3 text-center font-mono text-foreground">
                  {ex.weight || "—"}
                </td>
                <td className="px-6 py-3 text-center">
                  {ex.checked ? (
                    <span className="text-green-400 text-xs font-bold">✓ Done</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dayPlan.exercises.length === 0 && (
          <div className="py-6 text-center text-muted-foreground text-sm">
            No exercises detected for this day.
          </div>
        )}
      </div>
    </div>
  );
}
