## 2024-05-26 - Dynamic ARIA Labels for Icon-Only Buttons
**Learning:** Icon-only buttons with dynamically changing states (e.g., toggling between "Start listening" and "Stop listening") need their `aria-label` attributes bound to the same dynamic variable as their `title` attribute. Otherwise, screen readers will receive static, inaccurate state context.
**Action:** Always ensure that when adding `aria-label` to icon-only buttons with conditional `title` props, the `aria-label` mirrors the exact same conditional logic.
