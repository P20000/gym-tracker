"use client";

import { useState, useTransition } from "react";
import { sendMagicLink } from "./actions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{
    success: boolean;
    error: string | null;
    message: string | null;
  }>({
    success: false,
    error: null,
    message: null,
  });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setState({ success: false, error: null, message: null });

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      const res = await sendMagicLink(null, formData);

      if (res.success) {
        setState({
          success: true,
          error: null,
          message: res.message || "Magic Link generated successfully!",
        });
      } else {
        setState({
          success: false,
          error: res.error || "Failed to send login link",
          message: null,
        });
      }
    });
  };

  return (
    <div className="w-full max-w-sm px-6 py-8 bg-card border border-border rounded-xl shadow-2xl">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Gym Tracker
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a passwordless magic login link
        </p>
      </div>

      {state.success ? (
        <div className="flex flex-col space-y-4 text-center">
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-300 text-sm">
            <p className="font-semibold mb-1">✨ Magic Link Generated!</p>
            <p>{state.message}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Since we are in local development mode, we printed your login link to the 
            <strong> terminal console where your Next.js dev server is running</strong>.
          </p>
          <button
            onClick={() => {
              setState({ success: false, error: null, message: null });
              setEmail("");
            }}
            className="touch-target haptic-btn w-full mt-2 py-3 px-4 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Go Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. lifter@gym.com"
              disabled={isPending}
              className="touch-target w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 text-base"
            />
          </div>

          {state.error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs">
              ⚠️ {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !email}
            className="touch-target haptic-btn w-full flex items-center justify-center py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 text-base shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <div className="flex items-center space-y-0 space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Sending magic link...</span>
              </div>
            ) : (
              "Send Magic Link"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
