## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Optimizing Zustand Subscriptions with useShallow
**Learning:** Found that destructing multiple state properties from a Zustand store without using a selector (e.g., `const { a, b } = useStore()`) subscribes the component to ALL store updates, causing unnecessary re-renders when unrelated states change. This is a common performance anti-pattern.
**Action:** Used `useShallow` from `zustand/react/shallow` to strictly scope subscriptions to the accessed variables (e.g., `useStore(useShallow(s => ({ a: s.a, b: s.b })))`), preventing cascading renders during un-related state changes.
