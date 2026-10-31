## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-10-31 - [Zustand Store Re-Renders]
**Learning:** Using direct destructuring (e.g. `const { x, y } = useWorkspaceStore()`) in Zustand causes the component to re-render whenever *any* state in the store changes, even if `x` or `y` are unchanged.
**Action:** Always use `useShallow` from `zustand/react/shallow` to bundle multiple state slice subscriptions to prevent unnecessary component re-renders.
