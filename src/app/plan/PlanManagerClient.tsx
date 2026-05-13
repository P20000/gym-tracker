"use client";

import { useState, useTransition } from "react";
import { saveTemplateAction } from "../workoutActions";
import Link from "next/link";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: string | null;
  exercises: { exerciseId: string; sortOrder: number }[];
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlanManagerClient({
  exercises,
  existingTemplates,
}: {
  exercises: Exercise[];
  existingTemplates: Template[];
}) {
  const [activeTab, setActiveTab] = useState<string>("Monday");
  const [plans, setPlans] = useState(() => {
    const initial: Record<string, { name: string; description: string; exerciseIds: string[] }> = {};
    DAYS_OF_WEEK.forEach((day) => {
      const matching = existingTemplates.find((t) => t.dayOfWeek === day);
      if (matching) {
        initial[day] = {
          name: matching.name,
          description: matching.description || "",
          exerciseIds: matching.exercises.map((e) => e.exerciseId),
        };
      } else {
        initial[day] = {
          name: `${day} Workout`,
          description: "",
          exerciseIds: [],
        };
      }
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentPlan = plans[activeTab];

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addExercise = (exId: string) => {
    setPlans((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        exerciseIds: [...prev[activeTab].exerciseIds, exId],
      },
    }));
  };

  const removeExercise = (index: number) => {
    setPlans((prev) => {
      const updatedIds = [...prev[activeTab].exerciseIds];
      updatedIds.splice(index, 1);
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          exerciseIds: updatedIds,
        },
      };
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPlans((prev) => {
      const updatedIds = [...prev[activeTab].exerciseIds];
      const temp = updatedIds[index];
      updatedIds[index] = updatedIds[index - 1];
      updatedIds[index - 1] = temp;
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          exerciseIds: updatedIds,
        },
      };
    });
  };

  const moveDown = (index: number) => {
    if (index === currentPlan.exerciseIds.length - 1) return;
    setPlans((prev) => {
      const updatedIds = [...prev[activeTab].exerciseIds];
      const temp = updatedIds[index];
      updatedIds[index] = updatedIds[index + 1];
      updatedIds[index + 1] = temp;
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          exerciseIds: updatedIds,
        },
      };
    });
  };

  const handleSave = () => {
    setSuccessMessage(null);
    startTransition(async () => {
      try {
        await saveTemplateAction(
          activeTab,
          currentPlan.name,
          currentPlan.description,
          currentPlan.exerciseIds
        );
        setSuccessMessage(`Successfully saved plan for ${activeTab}!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        alert("Failed to save template.");
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 z-10">
      {/* Top bar with back to home link */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Weekly Plan Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure routines for each day of the week. Dispatcher auto-loads today&apos;s routine.
          </p>
        </div>
        <Link
          href="/"
          className="touch-target haptic-btn inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl border border-border hover:bg-secondary/80 transition-all"
        >
          ⬅ Back to Dashboard
        </Link>
      </div>

      {/* 7-Day Horizontal Tabs */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none space-x-2 border-b border-border/50">
        {DAYS_OF_WEEK.map((day) => {
          const count = plans[day]?.exerciseIds.length || 0;
          const isActive = activeTab === day;
          return (
            <button
              key={day}
              onClick={() => {
                setActiveTab(day);
                setSuccessMessage(null);
              }}
              className={`touch-target px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap flex items-center space-x-2 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span>{day.slice(0, 3)}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-card text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Left Column: Routine Configuration & Selected Exercises */}
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center justify-between">
              <span>{activeTab} Routine</span>
              {successMessage && (
                <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 animate-fade-in">
                  {successMessage}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Routine Name
              </label>
              <input
                type="text"
                value={currentPlan.name}
                onChange={(e) =>
                  setPlans((prev) => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], name: e.target.value },
                  }))
                }
                className="touch-target w-full bg-input text-foreground px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                placeholder="e.g., Push Day A, Back & Biceps"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={currentPlan.description}
                onChange={(e) =>
                  setPlans((prev) => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], description: e.target.value },
                  }))
                }
                className="touch-target w-full bg-input text-foreground px-4 py-2 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                placeholder="Focus on progressive overload..."
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Selected Exercises ({currentPlan.exerciseIds.length})
            </h3>
            {currentPlan.exerciseIds.length === 0 ? (
              <div className="p-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                No exercises assigned to {activeTab} yet. Search and add from the right panel.
              </div>
            ) : (
              <div className="space-y-3">
                {currentPlan.exerciseIds.map((exId, idx) => {
                  const ex = exercises.find((e) => e.id === exId);
                  if (!ex) return null;
                  return (
                    <div
                      key={`${exId}-${idx}`}
                      className="flex items-center justify-between bg-secondary/40 border border-border p-3 rounded-xl hover:border-primary/30 transition-all shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-foreground">{ex.name}</p>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground uppercase">
                            {ex.muscleGroup}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="touch-target haptic-btn p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center w-10 h-10"
                          title="Move Up"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={idx === currentPlan.exerciseIds.length - 1}
                          className="touch-target haptic-btn p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center w-10 h-10"
                          title="Move Down"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(idx)}
                          className="touch-target haptic-btn p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-center w-10 h-10 ml-1"
                          title="Remove Exercise"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="touch-target haptic-btn w-full py-4 px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center text-sm"
          >
            {isPending ? "💾 Saving Plan..." : `💾 Save ${activeTab} Routine`}
          </button>
        </div>

        {/* Right Column: Searchable Exercise Library */}
        <div className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-foreground">Exercise Library</h2>
            <p className="text-muted-foreground text-xs mt-1">Tap ➕ to add to {activeTab}&apos;s routine</p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="touch-target w-full bg-input text-foreground px-4 py-3 pl-10 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder="🔍 Search exercises by name..."
            />
            <span className="absolute left-3 top-3.5 text-muted-foreground">🔍</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredExercises.length === 0 ? (
              <div className="p-8 text-center bg-secondary/10 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                No exercises found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/60 border border-border/60 rounded-xl transition-all"
                >
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{ex.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground uppercase mt-1">
                      {ex.muscleGroup}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addExercise(ex.id)}
                    className="touch-target haptic-btn px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs uppercase rounded-lg border border-primary/20 transition-all flex items-center space-x-1"
                  >
                    <span>➕ Add</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
