## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-18 - Prevent Zustand Unnecessary Re-renders
**Learning:** Destructuring from a Zustand store (e.g., `const { foo, bar } = useWorkspaceStore()`) without a selector subscribes the component to all store updates, causing unnecessary re-renders.
**Action:** Use specific selectors for single properties (e.g., `const foo = useWorkspaceStore(s => s.foo)`) or `useShallow` from `zustand/react/shallow` for multiple properties (e.g., `const { foo, bar } = useWorkspaceStore(useShallow(s => ({ foo: s.foo, bar: s.bar })))`) to bundle state subscriptions efficiently.
