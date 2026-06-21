## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## $(date +%Y-%m-%d) - Adding ARIA labels to chat interface action buttons
**Learning:** Found that the dynamic state buttons in `MessageRow` (e.g. Read Aloud vs Stop Reading) lacked accessibility bindings for their toggled states. While they visually indicated changes via `title` tags, screen readers missed this context.
**Action:** When creating icon-only buttons with toggled states, always ensure the `aria-label` attribute is bound to the same dynamic text value as the `title` attribute.
