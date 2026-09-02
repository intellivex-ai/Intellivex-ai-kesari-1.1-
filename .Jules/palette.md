## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-05-17 - Icon-only buttons lacking accessible names
**Learning:** Found multiple instances (`AgentSelector`, `VisionHUD`, `VoiceOrb`) where standard `title` attributes were used on icon-only buttons instead of `aria-label`. Screen readers often prioritize `aria-label` or require it for reliable button naming, especially when `title` isn't consistently read by all AT combinations.
**Action:** Always verify that interactive elements relying solely on icons (like Lucide React components) have an explicit `aria-label`, even if a `title` tooltip is present, to ensure robust WCAG 2.5.3 compliance.
