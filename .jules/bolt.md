## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-04-16 - Memoization in Chat App
**Learning:** Found multiple un-memoized UI components inside the heavy `MessageRow` and `MarkdownBody` that are rendered inside the chat application. `MessageRow` uses memo, but the inner blocks such as `CodeBlock`, `TextBlock`, `MarkdownBody`, `ThoughtBlock` and `ToolBlock` are not memoized, which can lead to excessive re-rendering during streaming and when a large number of messages is present in the chat.
**Action:** Use `React.memo()` to prevent unnecessary re-renders of expensive chat content blocks.
