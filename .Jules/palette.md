## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-05-18 - Accessibility for interactive blocks and inputs
**Learning:** Found that custom interactive block components (like ThoughtBlock, ToolBlock toggles) and custom textarea inputs were missing crucial ARIA attributes. Specifically, `aria-expanded` is necessary for collapsible sections toggled by buttons so that screen readers know their current state. Furthermore, inputs (like textareas) without visible labels *must* have an `aria-label` since `placeholder` is not a substitute for a label according to accessibility standards.
**Action:** When creating or modifying custom interactive components (like expanding sections or custom text inputs), always ensure `aria-expanded` and `aria-label` are provided where appropriate.
