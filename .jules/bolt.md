## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Optimize Zustand destructuring with useShallow
**Learning:** Destructuring directly from `useStore()` (e.g., `const { a, b } = useStore()`) without a selector causes the component to subscribe to the entire store. Any state update will trigger a re-render of this component, even if the destructured values didn't change, defeating optimizations like `React.memo()`.
**Action:** Always use specific selectors for single values (`useStore(s => s.a)`). For multiple values, bundle state subscriptions efficiently using `useShallow` from `zustand/react/shallow` (`useStore(useShallow(s => ({ a: s.a, b: s.b })))`) to prevent full component re-renders.
