## 2025-05-18 - Ensure aria-labels are present on all icon-only buttons
**Learning:** Found multiple instances where buttons used only icons and had a `title` attribute for tooltips, but lacked an `aria-label` attribute, making them inaccessible to screen readers since `title` does not reliably act as an accessible name across all screen reader and browser combinations.
**Action:** When adding or modifying icon-only buttons, always ensure that an explicit `aria-label` is provided, matching the descriptive text of the `title` attribute if present, to ensure robust accessibility.
