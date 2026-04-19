## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2023-10-27 - Streaming Markdown Rendering Optimization
**Learning:** During streaming markdown generation in React, text updates token by token. Without memoizing inner text blocks (`TextBlock`, `MarkdownBody`, `CodeBlock`), every new token causes a full re-parse and re-render of all previously generated text blocks within the message. This leads to an O(N^2) rendering bottleneck, where N is the number of tokens.
**Action:** Always wrap block-level components (`TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, `CodeBlock`) inside streaming containers with `React.memo()` so only the block currently actively receiving streaming tokens re-renders.
