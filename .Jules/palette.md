## 2024-05-06 - Missing ARIA labels on heavily utilized icon-only chat buttons
**Learning:** The main chat interface `src/App.tsx` extensively uses icon-only buttons with `title` attributes for tooltips, but screen readers rely on explicit `aria-label`s. Relying solely on `title` is an accessibility anti-pattern in this specific application, as observed across 30+ interactive elements.
**Action:** Always verify that every `title` attribute on an icon button is accompanied by a matching `aria-label` to ensure both visual tooltips and screen reader announcements are populated.
