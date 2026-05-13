"use client";

import { useTransition } from "react";
import { startWorkoutSessionAction } from "./workoutActions";
import Link from "next/link";

export default function HomeDispatcherClient({
  todayDay,
  templateId,
  templateName,
  templateDescription,
}: {
  todayDay: string;
  templateId: string;
  templateName: string;
  templateDescription?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const handleStartSession = () => {
    startTransition(async () => {
      try {
        await startWorkoutSessionAction(templateId);
      } catch (err) {
        alert("Failed to start workout session. Please make sure exercises are assigned to this routine.");
      }
    });
  };

  return (
    <div className="bg-gradient-to-br from-card to-secondary/30 border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-accent border border-primary/20">
            📅 Today&apos;s Split: {todayDay}
          </span>
          <Link
            href="/plan"
            className="text-xs font-bold text-muted-foreground hover:text-foreground underline transition-all"
          >
            Edit Weekly Split
          </Link>
        </div>

        <h2 className="text-3xl font-black text-foreground tracking-tight mt-2">
          {templateName}
        </h2>
        {templateDescription && (
          <p className="text-muted-foreground text-sm max-w-md">
            {templateDescription}
          </p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartSession}
          disabled={isPending}
          className="touch-target haptic-btn w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-extrabold text-base uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
        >
          <span>{isPending ? "⚡ Generating Snapshot..." : "🚀 Start Live Workout"}</span>
        </button>
      </div>
    </div>
  );
}
