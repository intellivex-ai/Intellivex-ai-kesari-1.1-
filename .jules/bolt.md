## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2026-06-15 - Zustand useShallow Optimization
**Learning:** Destructuring from a Zustand store (e.g., `const { a, b } = useWorkspaceStore()`) without a selector or `useShallow` subscribes the component to the entire store, causing unnecessary re-renders whenever any state in the store changes.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.runCode)`) for single properties or `useShallow` from `zustand/react/shallow` for multiple properties to prevent wasteful re-renders.
