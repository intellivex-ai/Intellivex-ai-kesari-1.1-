## 2024-08-29 - Added ARIA labels to AgentSelector
**Learning:** Found multiple icon-only buttons (`agent-market-close`, `agent-search-clear`) lacking explicit accessible names, causing poor screen reader experience in dynamic components.
**Action:** Always verify custom popover and search input elements include descriptive `aria-label` attributes for icon-only action buttons to satisfy WCAG 2.5.3 (Label in Name).
