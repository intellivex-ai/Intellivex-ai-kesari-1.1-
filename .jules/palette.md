
## $(date +%Y-%m-%d) - Ensure ARIA labels on Icon-only buttons
**Learning:** Found a common accessibility pattern in this repository where icon-only buttons rely entirely on `title` attributes for tooltips, but lack `aria-label` attributes for screen readers. Using `title` alone without `aria-label` is an accessibility anti-pattern.
**Action:** When creating or modifying icon-only buttons in the application, I will always include both a `title` attribute (for visual tooltips) and an explicit `aria-label` attribute (for screen reader accessibility).
