## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-05-30 - Zustand useShallow Optimization
**Learning:** Destructuring directly from Zustand hooks (e.g. `const { runCode } = useWorkspaceStore()`) subscribes the component to the entire store, causing unnecessary re-renders when any state changes, even if unused by the component.
**Action:** Use `useShallow` from `zustand/react/shallow` when destructuring multiple values or use selector functions (e.g., `s => s.runCode`) for single values to bundle subscriptions efficiently.
