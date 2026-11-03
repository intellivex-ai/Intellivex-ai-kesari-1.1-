## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2023-10-27 - Dynamic A11y Attributes for State-Toggled Icon Buttons
**Learning:** Icon-only buttons with dynamic visual states (like "Copy" toggling to "Copied!", or "Read aloud" toggling to "Stop reading") must have their `aria-label` attributes dynamically bound to the same state. A static `aria-label` becomes inaccurate as soon as the state changes, confusing screen reader users.
**Action:** When adding `aria-label`s to dynamic icon buttons, always use conditional logic (e.g., `aria-label={copied ? "Copied!" : "Copy"}`) matching the visual state or `title` attribute.
