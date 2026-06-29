## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Zustand Destructuring Re-render Trap
**Learning:** Destructuring directly from a Zustand hook without a selector (e.g., `const { foo, bar } = useStore()`) subscribes the component to *all* updates in the store, negating the benefits of React memoization. This was happening in `App`, `WorkspacePanel`, and `CodeBlock` with `useWorkspaceStore`.
**Action:** Always use specific selectors (e.g., `useStore(s => s.foo)`) or `useShallow` from `zustand/react/shallow` (e.g., `useStore(useShallow(s => ({ foo: s.foo, bar: s.bar })))`) when reading multiple values to guarantee the component only re-renders when the specifically requested state changes.
