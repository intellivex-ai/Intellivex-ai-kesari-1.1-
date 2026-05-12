## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-05-12 - Memoizing Markdown components
**Learning:** In a streaming LLM UI, markdown chunks are constantly appended to the state, causing the entire `MarkdownBody` to re-render. If internal blocks like `TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownTable`, and `CodeBlock` are not memoized, it results in O(N^2) cascading re-renders during token streaming. Also, `MarkdownTable` recreated its array prop `lines` on every render, which requires a custom equality function to actually trigger the memoization.
**Action:** Wrapped structural markdown block components in `React.memo` and implemented custom equality functions for array props.
