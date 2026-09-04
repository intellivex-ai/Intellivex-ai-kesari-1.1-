## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2026-09-04 - Dynamic ARIA Labels for Interactive UI States
**Learning:** When adding `aria-label`s to components with dynamic states (e.g., a "Copy" button that temporarily shows "Copied!"), the accessibility label must dynamically track this state `aria-label={copied ? 'Message copied' : 'Copy message'}` to ensure screen readers provide accurate real-time feedback without masking critical state updates.
**Action:** Always verify if an interactive element has a temporary success/loading state when assigning an `aria-label`, and use ternary operators to bind the label to that state dynamically.
