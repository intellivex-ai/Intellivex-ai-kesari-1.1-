## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.

## 2026-05-28 - ARIA labels for Chat Actions
**Learning:** Icon-only buttons for repetitive message actions (Copy, Edit, TTS, Regenerate) in chat UIs are extremely opaque to screen readers if missing `aria-label`. We should consistently mirror their tooltips (`title`) into `aria-label`s to create a reliable audio context for keyboard accessibility users.
**Action:** Always ensure any dynamic states in chat UI (like "Stop reading" vs "Read aloud") are mirrored in both `title` and `aria-label` properties synchronously.
