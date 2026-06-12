## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Optimizing Zustand Subscriptions with useShallow
**Learning:** Found that directly destructuring from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) subscribes the component to *all* store updates, causing unnecessary re-renders whenever any unrelated state in the store changes.
**Action:** Used specific selectors for single values (e.g., `useWorkspaceStore(s => s.runCode)`) and `useShallow` from `zustand/react/shallow` for multiple values to explicitly map the required state. This ensures components only re-render when the specific state they consume actually changes.
