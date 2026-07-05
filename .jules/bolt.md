## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Memoizing Sub-components and using useShallow
**Learning:** Found that `MarkdownTable`, `TextBlock`, `ThoughtBlock`, `ToolBlock`, `MarkdownBody`, and `CodeBlock` in `src/App.tsx` and `src/components/CodeBlock.tsx` were not memoized. Also noticed `useWorkspaceStore` destructuring multiple state slice subscriptions without `useShallow` in `src/components/WorkspacePanel.tsx` causing unnecessary re-renders.
**Action:** Applied `React.memo` to all dynamic sub-components rendering markdown and updated the `useWorkspaceStore` calls to use `useShallow` and bundled multiple state slice subscriptions.
