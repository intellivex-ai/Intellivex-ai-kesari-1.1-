## 2026-06-22 - Dynamic state buttons aria-label binding
**Learning:** Dynamic state buttons (like the TTS toggle) must have their `aria-label` bound dynamically to match their changing `title` attribute to ensure screen readers receive accurate state context.
**Action:** Always ensure that if a button's `title` depends on a condition (like `playingTTS ? "Stop reading" : "Read aloud"`), its `aria-label` mirrors this exact same logic.
