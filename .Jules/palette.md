## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-10-27 - AgentSelector Component Uses Icon-Only Buttons
**Learning:** The `AgentSelector` component relies heavily on icon-only buttons for close and clear search actions, which is inaccessible to screen readers without `aria-label`s. Search input also lacks accessible name binding.
**Action:** Always verify custom popovers/dialogs for icon-only control buttons (`X` close icons, clear input icons) and explicitly add `aria-label`s and `title`s to them.
