## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2024-11-01 - Dynamic ARIA labels for stateful buttons
**Learning:** When adding `aria-label` attributes to React components with dynamic text or states (e.g., a copy button toggling between "Copied!" and "Copy", or a reaction button toggling between active and inactive), the `aria-label` must also be dynamically computed to keep screen readers accurately synced with the visual state.
**Action:** Ensure `aria-label` attributes accurately reflect the current state (like `{copied ? "Message copied" : "Copy message"}`) instead of a static label.
