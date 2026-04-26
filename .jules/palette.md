## 2024-04-26 - Missing ARIA Labels on Icon-only Buttons
**Learning:** React applications with numerous icon-only buttons (especially using lucide-react) frequently omit `aria-label` attributes, relying only on `title`. While `title` provides tooltips for mouse users, `aria-label` is crucial for screen readers to announce the button's purpose properly. This pattern is prevalent in header and message action buttons.
**Action:** Always add `aria-label` attributes mirroring the `title` or providing descriptive context to icon-only buttons to ensure full accessibility.
