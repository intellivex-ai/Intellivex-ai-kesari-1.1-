## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Memoizing Message Blocks (Markdown Rendering)
**Learning:** Found that sub-components for rendering markdown blocks (`TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, `CodeBlock`) were not memoized. During AI response streaming, every new token triggered a re-render of the entire component tree for the currently streaming message, leading to noticeable performance degradation and CPU spikes.
**Action:** Applied `React.memo` to these components to ensure only the actively changing blocks re-render, reducing unnecessary virtual DOM diffing for static message content.
