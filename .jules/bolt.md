## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-21 - Zustand Destructuring Re-renders
**Learning:** Found that destructuring from a Zustand store (e.g., `const { a, b } = useStore()`) without a selector or `useShallow` subscribes the component to ALL store updates, causing unnecessary re-renders when unrelated state changes. This is a common anti-pattern that defeats `React.memo()`.
**Action:** Always use specific selectors (e.g., `useStore(s => s.a)`) or `useShallow` from `zustand/react/shallow` (e.g., `useStore(useShallow(s => ({ a: s.a, b: s.b })))`) when accessing multiple slices of state to bundle state subscriptions efficiently without triggering full component re-renders.
