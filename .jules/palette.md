## 2024-08-28 - Missing ARIA Labels on Interactive Elements
**Learning:** Icon-only buttons used for close/remove/actions across major components (`App.tsx`, `VisionHUD.tsx`, `AgentSelector.tsx`) were missing `aria-label` attributes, relying entirely on visual icons and `title` tags, which violates WCAG guidelines for screen readers.
**Action:** When creating or reviewing components with icon-only buttons (especially in overlays/modals), always ensure an explicit `aria-label` is applied for accessibility.
