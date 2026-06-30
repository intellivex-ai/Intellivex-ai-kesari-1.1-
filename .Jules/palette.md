## 2024-06-30 - Added ARIA Labels to MessageRow Buttons
**Learning:** Icon-only buttons with dynamic state (like the TTS 'Read aloud'/'Stop reading' button) require their `aria-label` attributes to explicitly mirror their dynamic `title` state for proper screen reader context, otherwise the toggled state becomes invisible to assistive technologies.
**Action:** Always ensure `aria-label` bindings are identical to the dynamic conditions driving the `title` or visual icon when implementing icon-only toggle buttons.
