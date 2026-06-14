## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Optimizing Zustand Selectors
**Learning:** Destructuring multiple state variables directly from a Zustand store hook without a selector (e.g., `const { a, b } = useStore()`) subscribes the component to all store updates, causing unnecessary re-renders.
**Action:** Use `useShallow` from `zustand/react/shallow` to efficiently select multiple state slices (e.g., `const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })))`), or use single selectors when only one property is needed.
