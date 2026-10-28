## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2026-10-28 - Add ARIA Labels to Message Action Icons
**Learning:** Found several icon-only buttons in the chat message footer lacking `aria-label` attributes, which impairs keyboard and screen reader accessibility for core message interactions (copy, read aloud, regenerate, edit).
**Action:** Always add descriptive, dynamically-computed `aria-label` attributes to icon-only buttons to conform to WCAG guidelines, ensuring screen reader users understand the button's action and state (e.g. 'Copy message' vs 'Message copied').
