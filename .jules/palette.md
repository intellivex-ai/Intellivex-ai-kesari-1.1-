
## 2024-06-18 - Missing ARIA Labels on Core UI Buttons
**Learning:** Found an extensive pattern across `App.tsx` where icon-only buttons (`<button>` and `<motion.button>`) relied exclusively on the `title` attribute for screen readers. While `title` provides a visual tooltip, explicit `aria-label` is required for robust WCAG 2.5.3 compliance for non-visual users, especially on interactive elements like message actions, sidebar toggles, and chat settings.
**Action:** Always verify that strictly icon-only buttons include an `aria-label` attribute alongside `title`, explicitly binding them to the same static or dynamic values to ensure consistent state communication (e.g., toggling between "Read aloud" and "Stop reading").
