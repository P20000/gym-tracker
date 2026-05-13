### Phase 1: Context Population (Updates)

I will assume these rules for the following prompt:

* **Authentication Method:** Magic Link or Google OAuth (Entering passwords on a gym floor is a high-friction "vibe killer").
* **Touch Targets:** Minimum 48x48px for all interactive elements.
* **Input Mode:** `inputmode="email"` or `tel` to trigger the correct mobile keyboard immediately.
* **Safe Areas:** Accounting for the iOS "Home Indicator" and notch.

---

### Phase 2: The Technical Prompt for your Agent
> "Initialize the Authentication Page (`/login`) following the rules in `context/code-standards.md` and `context/ui-context.md`.
> **Technical Requirements:**
> 1. **Framework:** Use Next.js 15 Server Components for the layout and a Client Component for the Auth Form.
> 2. **Library:** Use `supabase-js` for the client-side auth.
> 3. **Mobile Optimization:**
> * Implement 'Magic Link' login to minimize typing.
> * Use a 'Haptic-like' feedback system (subtle CSS transitions) on button presses.
> * Ensure the layout uses `min-h-[100dvh]` (Dynamic Viewport Height) to prevent the mobile address bar from breaking the UI.
> 
> 
> 4. **Styling:** Use a 'Dark Mode' primary theme with a high-contrast 'Accent' color for the primary CTA. Use `ShadcnUI` for the Card and Input primitives.
> 5. **Multi-tenancy:** Ensure the post-login redirect points to a `/onboarding` flow if the `user_id` does not yet have a record in the `profiles` table."
> 
> 

---
