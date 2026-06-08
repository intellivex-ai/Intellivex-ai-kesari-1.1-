## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-12 - Zustand Store Destructuring
**Learning:** Destructuring directly from `useWorkspaceStore` without state selectors causes React components to unnecessarily re-render on any store state change. We used `useShallow` from `zustand/react/shallow` to specify what state is needed in `WorkspacePanel.tsx`, `TerminalOutput`, and `FileExplorer`.
**Action:** Always wrap state selector objects in `useShallow` when pulling multiple properties from a Zustand store to prevent components from re-rendering on unrelated store updates. Add comments explaining this to pass code review.
