## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-02-05 - Zustand Shallow Equality
**Learning:** Found that `WorkspacePanel`, `CodeBlock`, and `App` components were not using `useShallow` from `zustand/react/shallow` when destructured from `useWorkspaceStore()`. This caused these components to re-render whenever *any* unrelated state inside `useWorkspaceStore` updated (e.g., typing in the chat triggered re-renders in the workspace panel because of shared global state updates, or sandbox output changes re-rendered unaffected file explorers).
**Action:** Replaced destructuring with `useShallow` selectors for multiple properties and direct atomic selectors for single properties to ensure optimal React rendering.
