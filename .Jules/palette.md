## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.

## 2026-11-06 - Dynamic ARIA labels for stateful buttons
**Learning:** Components like copy buttons or TTS toggles need dynamically computed aria-labels (e.g. `aria-label={copied ? 'Code copied' : 'Copy code'}`) to keep screen readers synced with visual state.
**Action:** When adding aria-labels to stateful elements, always evaluate if the label needs to dynamically reflect the current state.
