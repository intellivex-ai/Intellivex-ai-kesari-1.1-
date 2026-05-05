## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Static Markdown Sub-components
**Learning:** Found that rendering dynamic streamed markdown can cause O(N^2) bottlenecks when static sub-components (like `CodeBlock`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, and `MarkdownTable`) re-render unnecessarily on each new chunk.
**Action:** Applied `React.memo` to all static Markdown sub-components to prevent them from re-rendering unless their specific content changes, drastically improving performance during streaming responses.
