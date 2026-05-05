## 2023-10-24 - Accessibility on icon-only buttons
**Learning:** Icon-only buttons relying solely on `title` attributes are an accessibility anti-pattern. While tooltips provide visual context, screen readers require explicit `aria-label` attributes to interpret the button's purpose correctly.
**Action:** Always ensure that icon-only interactive elements in this React application include both a descriptive `title` and a matching `aria-label`.
