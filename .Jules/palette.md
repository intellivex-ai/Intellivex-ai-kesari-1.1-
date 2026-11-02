## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.

## 2026-04-14 - Dynamic Aria Labels
**Learning:** Icon buttons with dynamic visual states (like copy to copied) need dynamic aria-labels to keep screen readers in sync.
**Action:** Use ternary operators on aria-labels for dynamic icon buttons.
