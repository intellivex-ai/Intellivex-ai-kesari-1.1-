## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Static Markdown Blocks during Streaming
**Learning:** During text streaming, React reconstructs the component tree. Since the application breaks markdown into sub-components (`TextBlock`, `CodeBlock`, `MarkdownTable`, etc.), a single new chunk of text causes *every* prior block to re-render, creating an O(N^2) performance bottleneck on long outputs. Furthermore, array props (like `lines` in `MarkdownTable`) are re-instantiated on each parent render, breaking default shallow comparison memoization.
**Action:** Wrapped all markdown sub-blocks in `React.memo()`. Crucially, added a custom equality comparator to `MarkdownTable` to check the actual string contents of the `lines` array prop, ensuring memoization succeeds despite reference changes.
