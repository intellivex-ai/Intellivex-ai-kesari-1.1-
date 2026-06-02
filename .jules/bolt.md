## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-02-12 - [Zustand React Re-renders Optimization]
**Learning:** Component destructuring from Zustand stores without selectors (e.g., `const { a, b } = useStore()`) implicitly subscribes the component to all store updates, destroying the benefits of React.memo().
**Action:** When extracting multiple slices of state, consistently use `useShallow` from `zustand/react/shallow` with a selector object (e.g., `useStore(useShallow(s => ({ a: s.a, b: s.b })))`). When picking single state values, use standard selectors (e.g., `useStore(s => s.a)`).
