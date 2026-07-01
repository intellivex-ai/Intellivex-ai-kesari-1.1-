## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2025-03-01 - Add ARIA Labels to Icon-Only Chat Buttons
**Learning:** Icon-only buttons for actions like "Copy message", "Read aloud", "Regenerate response", and "Edit message" lacked screen-reader accessible names. Without these, visually impaired users cannot understand what these critical action buttons do.
**Action:** Always verify that every icon-only button contains an `aria-label` attribute that clearly describes its function, mirroring the `title` tooltip if present. For dynamic states (like toggle buttons), ensure the `aria-label` dynamically updates alongside the visual/title state to reflect the current action.
