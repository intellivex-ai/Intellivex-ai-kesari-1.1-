## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-31 - Zustand Destructuring Anti-Pattern Causes App-Wide Re-renders
**Learning:** Destructuring directly from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) without a selector subscribes the consuming component to *all* state changes in the store, defeating React's rendering optimizations. For example, any time `panelWidth` changed during a resize drag, it triggered re-renders in `<App />`, `<WorkspacePanel />`, and `<CodeBlock />` because they all used unstructured destructuring.
**Action:** Always use specific selectors, or wrap multiple selections in `useShallow` from `zustand/react/shallow` (e.g., `useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`), especially in large component trees, to ensure components only re-render when their specific dependent state changes.
