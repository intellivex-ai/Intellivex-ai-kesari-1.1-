## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-12 - Missing Component Memoization for Sub-Components in List Iterators
**Learning:** Found that while the parent component `MessageRow` in `src/App.tsx` was memoized to prevent O(N^2) renders in a streaming chat app, its heavy sub-components (`MarkdownBody`, `TextBlock`, `MarkdownTable`, `CodeBlock`, etc.) were not. Consequently, if the row *does* re-render (e.g. active stream token updates), it forces all nested rich-text nodes to needlessly re-evaluate and re-render.
**Action:** Applied `React.memo` around inner message parsing components like `MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, and `CodeBlock` to short-circuit diffing at the leaf nodes during streaming chat updates.
