## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.

## 2026-04-15 - Dynamic ARIA Labels on Icon Buttons
**Learning:** When an icon-only button has dynamic states that change its `title` tooltip (e.g., "Read aloud" vs "Stop reading"), the `aria-label` must also explicitly bind to that same dynamic condition to ensure screen readers receive accurate, real-time state context.
**Action:** Explicitly bind the `aria-label` to the same dynamic condition/variable as the `title` attribute for icon-only toggles.
