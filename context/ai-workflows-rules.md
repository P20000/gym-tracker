# AI Workflow Rules

1. **Context Awareness:** Before suggesting a code change, check `architecture-context.md` to ensure it fits the serverless model.
2. **Schema First:** If a feature requires new data (e.g., a new muscle metric), suggest the Drizzle schema update before the UI code.
3. **Atomic Changes:** Provide code in small, testable increments.
4. **Validation:** Always include Zod validation for any user-facing forms.
