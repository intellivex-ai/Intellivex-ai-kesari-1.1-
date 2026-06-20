## 2025-02-23 - Dynamic aria-labels on icon-only toggle buttons
**Learning:** Icon-only buttons with dynamic toggling states in this application (e.g., "Read aloud" vs "Stop reading" in `MessageRow`) often use dynamic `title` attributes for sighted users but miss matching `aria-label` attributes, leaving screen reader users without state context.
**Action:** Always explicitly bind `aria-label` to the exact same dynamic condition or variable as the `title` attribute for any icon-only toggle button.
