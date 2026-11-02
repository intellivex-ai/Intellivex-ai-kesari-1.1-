## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-12 - Zustand useWorkspaceStore re-renders
**Learning:** Found that `WorkspacePanel.tsx`, `App.tsx`, and `CodeBlock.tsx` were importing `useWorkspaceStore` without `useShallow`, which causes unnecessary re-renders of the components when other state in the store updates. Zustand recommends using `useShallow` when extracting multiple states or returning an object to prevent unnecessary re-renders when other unused states in the store change.
**Action:** Applied `useShallow` from `zustand/react/shallow` when destructured multiple state properties from `useWorkspaceStore` in components.
