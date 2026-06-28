## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-06-28 - Prevent Unnecessary Re-renders via Zustand Selectors
**Learning:** Destructuring directly from a Zustand store (`const { runCode } = useWorkspaceStore()`) without a selector subscribes the component to *all* store updates, causing unnecessary re-renders when any state changes, completely defeating React memoization.
**Action:** Always use specific selectors for single properties (`useWorkspaceStore(s => s.runCode)`) or `useShallow` for multiple properties (`useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`) to bundle state subscriptions efficiently.
