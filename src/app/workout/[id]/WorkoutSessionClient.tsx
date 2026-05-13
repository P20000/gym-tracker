"use client";

import { useState, useTransition } from "react";
import {
  updateSetLogAction,
  completeWorkoutInstanceAction,
  cancelWorkoutInstanceAction,
} from "../../workoutActions";

type LogItem = {
  id: string;
  setIndex: number;
  weight: number;
  reps: number;
  completed: number;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
};

type WorkoutInstance = {
  id: string;
  name: string;
  status: string;
  createdAt: number | null;
};

export default function WorkoutSessionClient({
  instance,
  initialLogs,
}: {
  instance: WorkoutInstance;
  initialLogs: LogItem[];
}) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Optimistic update handler
  const handleUpdateSet = (logId: string, newWeight: number, newReps: number, newCompleted: number) => {
    // Optimistically update local state immediately
    setLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? { ...log, weight: newWeight, reps: newReps, completed: newCompleted }
          : log
      )
    );

    // Fire server action in background
    startTransition(async () => {
      try {
        await updateSetLogAction(logId, newWeight, newReps, newCompleted);
      } catch {
        // Revert on error or notify
      }
    });
  };

  const incrementWeight = (log: LogItem) => {
    handleUpdateSet(log.id, Number((log.weight + 2.5).toFixed(1)), log.reps, log.completed);
  };

  const decrementWeight = (log: LogItem) => {
    if (log.weight <= 0) return;
    handleUpdateSet(log.id, Number((Math.max(0, log.weight - 2.5)).toFixed(1)), log.reps, log.completed);
  };

  const incrementReps = (log: LogItem) => {
    handleUpdateSet(log.id, log.weight, log.reps + 1, log.completed);
  };

  const decrementReps = (log: LogItem) => {
    if (log.reps <= 0) return;
    handleUpdateSet(log.id, log.weight, Math.max(0, log.reps - 1), log.completed);
  };

  const toggleCompleted = (log: LogItem) => {
    const nextCompleted = log.completed === 1 ? 0 : 1;
    handleUpdateSet(log.id, log.weight, log.reps, nextCompleted);
  };

  // Group logs by exercise
  const exercisesMap = new Map<string, { exerciseName: string; muscleGroup: string; sets: LogItem[] }>();
  logs.forEach((log) => {
    if (!exercisesMap.has(log.exerciseId)) {
      exercisesMap.set(log.exerciseId, {
        exerciseName: log.exerciseName,
        muscleGroup: log.muscleGroup,
        sets: [],
      });
    }
    exercisesMap.get(log.exerciseId)!.sets.push(log);
  });

  const exercisesList = Array.from(exercisesMap.values());

  const handleFinishWorkout = () => {
    startTransition(async () => {
      await completeWorkoutInstanceAction(instance.id);
    });
  };

  const handleCancelWorkout = () => {
    if (confirm("Are you sure you want to cancel this workout session?")) {
      startTransition(async () => {
        await cancelWorkoutInstanceAction(instance.id);
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 z-10 pb-20">
      {/* Session Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">
              🔴 Active Live Session
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Started {instance.createdAt ? new Date(instance.createdAt).toLocaleTimeString() : "just now"}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mt-2">
            {instance.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your sets, adjust weights, and track reps. Estimated 1RM updates in real-time upon completion.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <button
            type="button"
            onClick={handleCancelWorkout}
            disabled={isPending}
            className="touch-target haptic-btn px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase rounded-xl border border-red-500/20 transition-all"
          >
            Cancel Session
          </button>
          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={isPending}
            className="touch-target haptic-btn px-6 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-extrabold text-sm uppercase rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center space-x-2"
          >
            <span>{isPending ? "Finishing..." : "🏁 Complete Workout"}</span>
          </button>
        </div>
      </div>

      {/* Exercise Sets List */}
      <div className="space-y-8">
        {exercisesList.map((ex, exIdx) => (
          <div
            key={`${ex.exerciseName}-${exIdx}`}
            className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6 overflow-hidden relative"
          >
            {/* Header for Exercise */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {exIdx + 1}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">{ex.exerciseName}</h2>
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground uppercase">
                    {ex.muscleGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* Sets Grid / Rows */}
            <div className="space-y-4">
              <div className="hidden md:grid md:grid-cols-12 text-xs font-bold uppercase tracking-wider text-muted-foreground px-4 pb-2 border-b border-border/30">
                <div className="col-span-1">Set</div>
                <div className="col-span-4 text-center">Weight (KG)</div>
                <div className="col-span-4 text-center">Reps</div>
                <div className="col-span-3 text-right pr-4">Status</div>
              </div>

              {ex.sets.map((set, sIdx) => {
                const isCompleted = set.completed === 1;
                return (
                  <div
                    key={set.id}
                    className={`flex flex-col md:grid md:grid-cols-12 items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? "bg-primary/5 border-primary/30 shadow-inner"
                        : "bg-secondary/20 border-border/60 hover:border-border"
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-1 flex items-center justify-between w-full md:w-auto font-black text-sm text-muted-foreground">
                      <span className="md:hidden text-xs uppercase tracking-wider">Set</span>
                      <span>#{sIdx + 1}</span>
                    </div>

                    {/* Weight Adjustment */}
                    <div className="col-span-4 flex items-center justify-center space-x-3 w-full">
                      <span className="md:hidden text-xs font-bold uppercase text-muted-foreground w-16">
                        Weight
                      </span>
                      <button
                        type="button"
                        onClick={() => decrementWeight(set)}
                        className="touch-target haptic-btn w-12 h-12 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold flex items-center justify-center text-lg shadow-sm"
                        title="Decrease Weight"
                      >
                        -
                      </button>
                      <div className="w-20 text-center">
                        <span className="text-xl font-black text-foreground">{set.weight}</span>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase">kg</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => incrementWeight(set)}
                        className="touch-target haptic-btn w-12 h-12 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold flex items-center justify-center text-lg shadow-sm"
                        title="Increase Weight"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps Adjustment */}
                    <div className="col-span-4 flex items-center justify-center space-x-3 w-full">
                      <span className="md:hidden text-xs font-bold uppercase text-muted-foreground w-16">
                        Reps
                      </span>
                      <button
                        type="button"
                        onClick={() => decrementReps(set)}
                        className="touch-target haptic-btn w-12 h-12 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold flex items-center justify-center text-lg shadow-sm"
                        title="Decrease Reps"
                      >
                        -
                      </button>
                      <div className="w-16 text-center">
                        <span className="text-xl font-black text-foreground">{set.reps}</span>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase">reps</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => incrementReps(set)}
                        className="touch-target haptic-btn w-12 h-12 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold flex items-center justify-center text-lg shadow-sm"
                        title="Increase Reps"
                      >
                        +
                      </button>
                    </div>

                    {/* Complete Button / Checkbox */}
                    <div className="col-span-3 flex items-center justify-end w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => toggleCompleted(set)}
                        className={`touch-target haptic-btn w-full md:w-auto px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                          isCompleted
                            ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-md shadow-green-500/10"
                            : "bg-secondary hover:bg-secondary/80 text-muted-foreground border border-border"
                        }`}
                      >
                        <span>{isCompleted ? "✅ Logged" : "⬜ Log Set"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
