## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## $(date +%Y-%m-%d) - Memoizing useWorkspaceStore subscriptions
**Learning:** Found that `useWorkspaceStore` was being called without selectors in several components (`App`, `CodeBlock`, `WorkspacePanel`), meaning these components would re-render whenever *any* value in the store changed (e.g. sandbox outputs appending would re-render the entire app).
**Action:** Used `useShallow` from `zustand/react/shallow` to bundle state slice subscriptions when fetching multiple properties, and direct selectors when fetching atomic properties, preventing these cascading re-renders.
