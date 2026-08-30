## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Memoize MarkdownBody and Avoid Zustand Anti-Pattern
**Learning:** Found that `MarkdownBody` was not memoized, which can lead to unnecessary re-renders of large markdown content. Also found an anti-pattern in `CodeBlock.tsx` where it was subscribed to the entire `useWorkspaceStore` via destructured selection (`const { openWorkspace, runCode } = useWorkspaceStore()`).
**Action:** Replaced the destructured store selection in `CodeBlock` with atomic selectors (`const openWorkspace = useWorkspaceStore((state) => state.openWorkspace);`). Added `React.memo` to both `CodeBlock` and `MarkdownBody`.
