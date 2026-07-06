## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Optimizing Zustand store subscriptions
**Learning:** Destructuring multiple properties directly from `useWorkspaceStore()` (or any Zustand store) causes the component to re-render whenever *any* state in the store changes, not just the destructured properties. This is a common but silent performance killer in React applications using Zustand.
**Action:** When selecting multiple values from a Zustand store, always wrap the selector with `useShallow` (imported from `zustand/react/shallow`) to bundle state slice subscriptions and prevent unnecessary cascading re-renders. When fetching a single atomic value, use a direct raw selector (e.g., `store(state => state.value)`) without `useShallow`.
