# Project Overview: Fitness Intelligence Platform

## Objectives
A multi-tenant SaaS application for bodybuilders to track strength progression with high-fidelity data visualization.

## Key Features
1. **Immutable Logging:** Uses a snapshot approach to log workouts; once a session is finished, it is a historical record.
2. **Strength Tracking:** Real-time dashboards using Tremor to visualize 1RM trends per muscle group.
3. **Smart UX:** Incremental weight adjustment ($+/- 2.5kg$) designed for rapid entry during rest periods.
4. **Knowledge Base:** Built-in static mapping for exercise alternatives (e.g., swapping a Barbell Row for a Chest-Supported Row if equipment is busy).