## 2026-04-14 - A11y Attributes for Icon Buttons
**Learning:** Icon-only buttons without `aria-label`s or `title`s severely impair screen reader and keyboard navigation users as they lack context. Adding these attributes significantly improves UX.
**Action:** Always ensure any icon-only button contains descriptive `aria-label` and `title` attributes that clarify their functionality.
## 2026-04-23 - App.tsx Missing aria-labels
**Learning:** Found multiple icon-only buttons without aria labels, impacting screen reader accessibility in the core chat application file.
**Action:** Added aria labels. Keep an eye out for missing aria labels on elements utilizing Lucide icons instead of text.
