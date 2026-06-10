## 2024-06-10 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Many icon-only buttons in `src/App.tsx` have `title` attributes for tooltips but lack explicit `aria-label` attributes for screen readers. WCAG requires icon-only buttons to have accessible names.
**Action:** Identify and add `aria-label` matching the `title` to all icon-only buttons without visible text.
