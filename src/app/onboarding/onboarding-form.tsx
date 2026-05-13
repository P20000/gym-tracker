"use client";

import { useState, useTransition } from "react";
import { saveOnboardingProfile } from "./actions";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      const res = await saveOnboardingProfile(null, formData);

      if (res.success) {
        // Force refresh router cache and redirect to home dashboard
        router.refresh();
        router.push("/");
      } else {
        setError(res.error || "Onboarding failed");
      }
    });
  };

  return (
    <div className="w-full max-w-sm px-6 py-8 bg-card border border-border rounded-xl shadow-2xl">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <div className="text-3xl text-center mb-1">⚡</div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Complete Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          What should we call you in your training dashboards?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Your Name / Nickname
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            disabled={isPending}
            className="touch-target w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 text-base"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="touch-target haptic-btn w-full flex items-center justify-center py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 text-base shadow-lg shadow-primary/20"
        >
          {isPending ? "Setting up profile..." : "Start Training"}
        </button>
      </form>
    </div>
  );
}
