## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-01-20 - Memoizing Zustand Store Selections
**Learning:** Found that directly destructuring multiple properties from a Zustand store (e.g., `const { a, b, c } = useStore()`) subscribes the component to the *entire* store, causing unnecessary re-renders whenever *any* value in the store changes.
**Action:** Applied `useShallow` from `zustand/react/shallow` to bundle multiple state slice subscriptions (e.g., `const { a, b, c } = useStore(useShallow(state => ({ a: state.a, b: state.b, c: state.c })))`) and used raw selectors for atomic values to prevent unnecessary re-renders.
