## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-12 - Zustand destructuring Anti-Pattern
**Learning:** Destructuring directly from `useWorkspaceStore()` without selectors (e.g., `const { x } = useWorkspaceStore()`) causes components to subscribe to ALL store updates. This defeated React.memo() and caused massive, cascading top-level re-renders during terminal output streaming or active file changes.
**Action:** Always use specific selectors (`useWorkspaceStore(s => s.x)`) or `useShallow` from `zustand/react/shallow` (`useWorkspaceStore(useShallow(s => ({ x: s.x })))`) when reading from a Zustand store to bundle state subscriptions efficiently without triggering full component re-renders.
