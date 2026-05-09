## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Memoizing Static Markdown Sub-Components
**Learning:** Found that static markdown components (like `TextBlock`, `MarkdownTable`, `ThoughtBlock`, `ToolBlock`, `CodeBlock`, and `MarkdownBody`) in `src/App.tsx` were not memoized. This caused an O(N^2) re-rendering bottleneck during token-by-token streaming of responses, as all previously rendered parts of a message were being re-rendered with each new incoming token.
**Action:** Applied `React.memo` to these static sub-components to prevent unnecessary re-rendering and improve overall UI responsiveness during message streaming.
