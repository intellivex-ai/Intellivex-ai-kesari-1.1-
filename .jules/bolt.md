## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-14 - Memoizing Markdown components
**Learning:** Sub-components rendered inside `MessageRow` such as `MarkdownBody`, `CodeBlock`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, and `MarkdownTable` should be memoized to prevent O(N^2) re-rendering bottlenecks of static message content during token-by-token streaming.
**Action:** Applied `React.memo` to these components.
