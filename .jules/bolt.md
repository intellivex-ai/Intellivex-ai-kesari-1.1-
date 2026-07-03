## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-18 - Memoize markdown sub-components for token streaming
**Learning:** During token streaming for AI messages in `src/App.tsx`, parent components re-render rapidly. Sub-components like `MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, and `MarkdownBody` were unmemoized, causing O(N) unnecessary re-renders. `MarkdownTable` also required a custom comparison function because its `lines` array prop was recreated on each render.
**Action:** Use `React.memo()` on dynamic sub-components involved in markdown streaming to prevent re-renders, and ensure complex props (like recreated arrays) use a custom comparison function. Use `useShallow` for Zustand selectors to fetch specific methods.
