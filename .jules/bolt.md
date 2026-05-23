## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-14 - Zustand useShallow
**Learning:** Destructuring from a Zustand store without a selector subscribes the component to all store updates, which defeats `React.memo()`. By using `useShallow`, components can safely select multiple state slices without triggering a full re-render on unrelated store updates.
**Action:** Use `useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))` for multi-value destructuring instead of `const { a, b } = useWorkspaceStore()`.
