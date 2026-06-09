## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-22 - Memoizing Markdown components during token streaming
**Learning:** Found that static sub-components of Markdown messages (`MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, `CodeBlock`) were not memoized. During token-by-token streaming, the entire React tree for historical messages was continuously re-rendering, causing significant O(N) performance overhead. Additionally, destructuring a Zustand store without a selector (e.g. `const { runCode } = useWorkspaceStore()`) defeated `React.memo()` entirely.
**Action:** Applied `React.memo` to these static sub-components and fixed Zustand anti-patterns by using specific selectors (e.g. `useWorkspaceStore(s => s.runCode)`) and `useShallow` where necessary, preventing unnecessary cascading re-renders during message streaming.
