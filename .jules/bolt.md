## 2025-02-23 - Prevent Full Re-renders with Zustand Selectors and useShallow
**Learning:** Destructuring from a Zustand store without a selector (e.g., `const { value } = useStore()`) subscribes the component to ALL store updates, completely defeating `React.memo()`.
**Action:** Always use specific selectors (e.g., `useStore(s => s.value)`) for single values, or the `useShallow` hook (`useStore(useShallow(s => ({ a: s.a, b: s.b })))`) from `zustand/react/shallow` when selecting multiple state slices to bundle subscriptions efficiently.
## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
