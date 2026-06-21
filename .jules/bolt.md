## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-02-12 - Prevent Unnecessary Re-renders with Zustand's useShallow
**Learning:** Destructuring from a Zustand store (e.g., `const { a, b } = useStore()`) without a specific selector or `useShallow` subscribes the component to all store updates, defeating React's memoization and causing O(N) re-renders, especially impactful during rapid state updates like streaming.
**Action:** Always use specific selectors (e.g., `useStore(s => s.property)`) or `useShallow` from `zustand/react/shallow` when selecting multiple properties to bundle subscriptions efficiently.
