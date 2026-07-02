## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2025-02-12 - WCAG 2.5.3 Redundant Text Violations on Buttons
**Learning:** Adding `aria-label` attributes to buttons that already contain visible descriptive text (e.g., buttons containing both an icon and a `<span>Text</span>`) creates redundant/misleading information for screen readers and masks dynamic state changes.
**Action:** When adding accessibility attributes to buttons, verify if the button is strictly icon-only or if it contains visible text. Only add `aria-label` matching the `title` for strictly icon-only buttons. Ensure dynamic state tracking in `aria-label` (e.g. play/pause toggles) mirrors the logic used for the `title`.
