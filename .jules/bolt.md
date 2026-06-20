## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-02-28 - Stop Zustand Destructuring Cascades
**Learning:** Destructuring directly from Zustand hooks (e.g., `const { files } = useWorkspaceStore()`) implicitly subscribes the component to the ENTIRE store, causing it to re-render whenever ANY store value changes, even if the destructured property itself didn't change. This defeated memoization in components like `App`, `CodeBlock`, and `WorkspacePanel`.
**Action:** Use specific selectors `useStore(s => s.prop)` for single values, or `useShallow` from `zustand/react/shallow` when selecting multiple slices `useStore(useShallow(s => ({ a: s.a, b: s.b })))` to bundle subscriptions safely.
