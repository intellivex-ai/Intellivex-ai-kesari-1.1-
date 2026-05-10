## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Streaming Markdown Components
**Learning:** Even if `MessageRow` is memoized, during token-by-token streaming of a single message, the entire markdown tree (`MarkdownBody`, `TextBlock`, `MarkdownTable`, `CodeBlock`, etc.) for that specific message re-renders. This causes O(N^2) parsing and DOM updates as the message grows. Furthermore, `MarkdownTable` receives an array prop created during the parent's render, defeating shallow memoization.
**Action:** Applied `React.memo` to all sub-components (`TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, `CodeBlock`). For `MarkdownTable`, added a custom comparison function to compare the `lines` array contents rather than object identity.
