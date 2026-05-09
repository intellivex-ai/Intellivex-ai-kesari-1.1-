## 2024-05-09 - Added missing ARIA labels to button tooltips
**Learning:** Icon-only buttons with tooltips must also use `aria-label` for screen reader accessibility, as `title` is insufficient. Many icon-only buttons in this app lacked `aria-label`.
**Action:** Always add `aria-label` to buttons where `title` is present, or when a button relies only on an icon for its label.
