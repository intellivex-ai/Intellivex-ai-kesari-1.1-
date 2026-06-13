## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## $(date +%Y-%m-%d) - Zustand useShallow
**Learning:** Destructuring from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) without a selector subscribes the component to all store updates, defeating `React.memo()` and causing unnecessary re-renders.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.runCode)`) or `useShallow` from `zustand/react/shallow` when selecting multiple state slices from a Zustand store.
