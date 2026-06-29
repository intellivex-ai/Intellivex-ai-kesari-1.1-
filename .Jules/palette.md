## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-03-24 - Accessibility for icon-only buttons
**Learning:** Icon-only buttons with dynamic states (e.g. Read aloud / Stop reading) need dynamic `aria-label`s that exactly mirror their `title`s to remain fully accessible and understandable to screen readers.
**Action:** Always check the `title` attribute of icon-only buttons for ternary operations, and apply the same logic to `aria-label`.
