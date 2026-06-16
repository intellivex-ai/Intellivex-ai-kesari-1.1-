## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2024-06-16 - [Zustand React.memo() Anti-Pattern]
**Learning:** Destructuring multiple values directly from a Zustand store (e.g., `const { a, b } = useWorkspaceStore()`) without a selector subscribes the component to *all* state updates in the store, defeating React's rendering optimizations and `React.memo()`.
**Action:** When selecting multiple properties, always use `useShallow` from `zustand/react/shallow` (e.g., `const { a, b } = useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`). When selecting a single property, use a simple selector (e.g., `const a = useWorkspaceStore(s => s.a)`).
