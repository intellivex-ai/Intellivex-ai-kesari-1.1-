## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-07-03 - Added ARIA labels to Icon-only Buttons
**Learning:** Found multiple icon-only buttons across main UI and sub-components (App.tsx, VisionHUD, AgentSelector) that relied solely on `title` for tooltip, missing `aria-label` for screen reader accessibility. Dynamic buttons like TTS read aloud require dynamic `aria-label` props matching their current state to give context accurately.
**Action:** Always ensure that icon-only interactive elements possess an `aria-label` attribute, keeping it in sync with the `title` tooltip and any dynamic states (e.g. `aria-label={playingTTS ? "Stop reading" : "Read aloud"}`).
