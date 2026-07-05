## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2025-07-05 - ARIA Labels for Immersive Voice Toggle
**Learning:** For interactive icon-only toggles (like the Immersive Voice Mode button) where the state and title change dynamically, the `aria-label` must also be dynamically bound to match the `title` attribute to provide accurate context to screen readers as the state updates.
**Action:** Always verify if an icon button has dynamic titles or state toggles and ensure the `aria-label` mirrors that dynamic logic (e.g., `aria-label={isActive ? 'Exit' : 'Enter'}`).
