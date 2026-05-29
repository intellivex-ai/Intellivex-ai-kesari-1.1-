## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-18 - Zustand Selector Anti-Pattern
**Learning:** Destructuring directly from a Zustand store (`const { runCode } = useWorkspaceStore()`) without a selector causes the component to subscribe to all store updates, rendering optimizations like `React.memo()` useless and causing unnecessary re-renders.
**Action:** Always use explicit selectors (`useWorkspaceStore(s => s.runCode)`) or `useShallow` for multiple properties to scope subscriptions correctly.
