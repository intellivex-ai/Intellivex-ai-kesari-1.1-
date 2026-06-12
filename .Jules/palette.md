## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-05-24 - Accessibility labels for icon-only buttons
**Learning:** Found several components utilizing icon-only buttons with `title` attributes but missing explicit `aria-label` attributes. While `title` gives a tooltip, `aria-label` is crucial for screen readers. Overriding `title` directly inside components to match the semantic description aids both visible tooltips and accessibility.
**Action:** When adding icon-only buttons, consistently include both `title` and `aria-label` mapped to the same descriptor, especially those bound to state changes (e.g. `title={listening ? 'Stop' : 'Start'} aria-label={listening ? 'Stop' : 'Start'}`).
