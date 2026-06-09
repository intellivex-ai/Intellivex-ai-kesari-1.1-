## 2024-06-09 - Dynamic ARIA labels for icon-only buttons
**Learning:** For icon-only buttons with dynamic toggling states (e.g., "Stop reading" vs "Read aloud"), explicitly binding the `aria-label` to the same dynamic condition/variable as the `title` attribute ensures screen readers receive accurate state context, rather than just having static descriptive text.
**Action:** When adding `aria-label` to buttons with dynamic `title` properties, mirror the dynamic conditional logic exactly to keep the tooltip and screen reader experience in sync.
