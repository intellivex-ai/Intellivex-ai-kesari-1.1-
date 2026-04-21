## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Markdown Sub-components
**Learning:** Found that `MarkdownBody` and its sub-components (`MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, and `CodeBlock`) were not memoized. In a chat application where messages are streamed token-by-token, React attempts to re-render all message components in the list. This leads to an O(N^2) rendering bottleneck, as the entire message history is re-rendered for every single token received.
**Action:** Applied `React.memo` to `MarkdownBody` and all of its sub-components in `src/App.tsx` and `src/components/CodeBlock.tsx`. This optimization prevents the expensive re-rendering of static historical message content during active token streaming.
