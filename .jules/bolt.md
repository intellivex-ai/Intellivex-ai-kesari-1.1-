## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-21 - Memoizing Zustand Selectors
**Learning:** Destructuring from a Zustand store (e.g., `const { ... } = useWorkspaceStore()`) without a selector subscribes the component to all store updates, causing unnecessary re-renders when unrelated properties change.
**Action:** When selecting multiple state slices from a Zustand store, always use the `useShallow` hook from `zustand/react/shallow` to bundle state subscriptions efficiently and prevent full component re-renders.
