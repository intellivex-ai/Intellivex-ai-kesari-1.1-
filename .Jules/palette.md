## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-10-26 - Dynamic aria-labels on toggled icon buttons
**Learning:** Found several icon-only buttons in `App.tsx` (e.g., "Copy", "Read aloud", "Voice input") that change state/icon but had static or missing `aria-label` attributes, which can mislead screen reader users about the current state.
**Action:** When adding accessibility to interactive icon buttons that toggle states (like play/stop, start/stop mic, copy/copied), always make the `aria-label` dynamically reflect the current state (e.g., `aria-label={copied ? "Message copied" : "Copy message"}`).
