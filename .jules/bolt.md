## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-02-12 - Zustand Store Re-render Anti-Pattern
**Learning:** Destructuring directly from a Zustand hook (e.g., `const { a, b } = useWorkspaceStore()`) implicitly subscribes the component to *all* state changes in that store, rendering optimizations like `React.memo` useless and causing cascading re-renders across the app when highly volatile state (like typing in a sandbox) updates.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.a)`) or `useShallow` from `zustand/react/shallow` when extracting multiple properties to bundle subscriptions and limit re-renders only to when the actual accessed state changes.
