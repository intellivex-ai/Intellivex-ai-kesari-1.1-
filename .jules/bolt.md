## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-17 - [Optimizing Zustand Selectors in React Components]
**Learning:** Destructuring state directly from `useWorkspaceStore()` (e.g., `const { runCode } = useWorkspaceStore()`) without passing a specific selector causes the component to subscribe to the entire store. This defeats standard `React.memo()` optimizations because any update to *any* property in the Zustand store triggers a re-render of the component.
**Action:** When extracting state from Zustand stores inside React components, always use a specific selector function to isolate subscriptions. For single state variables, use `const myState = useStore(s => s.myState)`. When retrieving multiple variables, combine them effectively using `zustand/react/shallow`'s `useShallow` hook (e.g., `useStore(useShallow(s => ({ a: s.a, b: s.b })))`) to prevent unnecessary component re-renders and improve performance cleanly.
