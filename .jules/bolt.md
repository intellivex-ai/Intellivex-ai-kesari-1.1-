## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Optimizing Zustand Selectors with useShallow
**Learning:** Found that several React components were destructuring the entire `useWorkspaceStore` state without using selectors, which is a common Zustand anti-pattern. This caused unnecessary re-renders of components like `WorkspacePanel`, `CodeBlock`, and `App` whenever any unrelated state in the store updated.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.runCode)`) when memoizing components that consume Zustand. When selecting multiple state slices, use the `useShallow` hook from `zustand/react/shallow` to efficiently bundle subscriptions and prevent full component re-renders.
