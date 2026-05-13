# Gym Tracker

A serverless, mobile-first gym and progression tracker designed for seamless daily workout logging, strength analytics, and quick-add nutrition tracking.

## Architecture Overview

This project is built using a fully serverless, highly optimized stack on **Vercel** and **Turso**. This minimizes operational overhead, ensures low latency on mobile devices, and keeps running costs at $0.

* **Frontend & API:** [Next.js](https://nextjs.org/) deployed on Vercel utilizing Server Actions for fast, direct database queries and state changes without a separate Express API.
* **Database:** [Turso](https://turso.tech/) for an ultra-fast, serverless libSQL/SQLite database with edge replication.
* **Auth:** Clerk or Auth.js (NextAuth) for secure, serverless-optimized user sessions.
* **State Management:** [React Query (TanStack)](https://tanstack.com/query) to handle aggressive caching, ensuring seamless transitions between workout routines and instant UI responsiveness.

---

## Core Features & Implementation

### 1. Strength Tracking & Progression Logic
* **Volume & e1RM Calculations:** Leverages Vercel Edge Functions to calculate Volume Load ($\text{Sets} \times \text{Reps} \times \text{Weight}$) and Estimated 1-Rep Max (e1RM).
* **Weekly Analytics Cron:** Weekly background syncs driven by Vercel Cron Jobs to aggregate workout logs, evaluate progression milestones, and generate dataset points for tracking diagrams.

### 2. Protein Tracker ("Quick-Add")
* **Favorites Cache:** A lightweight, serverless cache (or JSON-based user configuration) mapping top-10 frequent protein sources (e.g., Paneer, Tofu).
* **One-Tap Actions:** Instant increment triggers using Next.js Server Actions to record macros in a single tap.

### 3. Mobile-First Daily Workflow
* **Active Session View:** Large inputs, touch-friendly targets, and high-contrast UI tailored for gym floors and sweaty hands.
* **Rest Timer:** An automated visual rest timer triggered immediately when check-marking a completed set.
* **Progression Ghosting:** Shows the weight/reps performed last week in a light gray font inside input boxes as placeholders—serving as direct, actionable workout targets.

---

## Infrastructure Comparison: AWS EKS vs. Vercel

| Feature | AWS EKS Setup | Vercel Serverless (Proposed) |
| :--- | :--- | :--- |
| **Cold Starts** | None (Always running) | Minimal (Edge-optimized Next.js) |
| **Monthly Cost** | ~$50+/month (Control plane, nodes, RDS) | $0 (Hobby/Free Tier) |
| **Maintenance** | High (K8s updates, manifests, Terraform) | Zero (Direct Git push deployment) |
| **Database Setup** | Self-managed RDS / certs | Serverless (Turso / libSQL) |

---

