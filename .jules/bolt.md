## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2026-04-20 - Memoizing Markdown Sub-components
**Learning:** Found that static markdown components (`MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, `CodeBlock`) were not memoized in `src/App.tsx` and `src/components/CodeBlock.tsx`. This causes an O(N^2) re-rendering bottleneck for static message segments during token-by-token streaming, significantly degrading performance for large messages.
**Action:** Applied `React.memo()` to these components so that already-completed blocks don't needlessly re-render every time a new token arrives in the streaming message.
