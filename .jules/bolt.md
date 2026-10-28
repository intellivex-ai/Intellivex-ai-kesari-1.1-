## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Zustand Selectors
**Learning:** Found that destructured selectors on Zustand stores (e.g. `useWorkspaceStore`) cause components to re-render whenever *any* state in the store changes, even if the selected fields haven't changed. This is a common performance bottleneck.
**Action:** Applied `useShallow` from `zustand/react/shallow` to all destructuring calls to `useWorkspaceStore` to bundle multiple state slice subscriptions and prevent unnecessary component re-renders.
