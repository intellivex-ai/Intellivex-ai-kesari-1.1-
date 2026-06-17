## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Zustand Anti-Pattern
**Learning:** Destructuring from a Zustand store without a selector subscribes the component to all store updates, defeating `React.memo()` and causing unnecessary cascading re-renders across the app. This is especially problematic in highly interactive apps like this chat UI.
**Action:** Always use specific property selectors (e.g., `useWorkspaceStore(s => s.runCode)`) for single values or Zustand's `useShallow` hook (e.g., `useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`) for multiple values when consuming state from a Zustand store.
