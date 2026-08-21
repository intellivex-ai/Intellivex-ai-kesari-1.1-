## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-03-24 - Accessibility labels on dynamic text buttons
**Learning:** Adding `aria-label` to buttons that already contain visible descriptive text violates WCAG 2.5.3 (Label in Name rule) because the accessible name may no longer match the visible text. This is particularly problematic in this app's components for buttons that have dynamic text states (e.g., a button that changes from "Download" to "Saving..."), as a static `aria-label` will mask this dynamic state change from screen readers.
**Action:** When adding ARIA labels to improve screen reader support, strictly target icon-only elements or elements where the visible text is insufficient on its own. Do not blindly map `title` attributes to `aria-label` on buttons that contain visible text.
