## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2025-01-20 - Fixing Zustand Re-render Anti-Pattern
**Learning:** Found multiple instances where components destructure variables directly from a Zustand store hook without a selector, e.g. `const { runCode } = useWorkspaceStore()`. This causes the component to subscribe to all updates on the store, causing unnecessary re-renders whenever *any* unrelated state changes.
**Action:** Applied the explicit selector pattern `s => s.property` for single variables or `useShallow` for multiple variables, e.g. `const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })))` to enforce that React components only subscribe to the slices of the store they actually need.
