## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-11-03 - Zustand destructuring causes excessive re-renders
**Learning:** Directly destructuring multiple properties from a Zustand store (e.g. `const { a, b } = useStore()`) causes the component to re-render whenever ANY property in the entire store changes, because Zustand by default uses strict equality `===` on the returned state object. This is a common performance pitfall in this codebase.
**Action:** When selecting multiple atomic values from a Zustand store, ALWAYS use `useShallow` from `zustand/react/shallow` to bundle the subscriptions (e.g., `const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })))`). If selecting a single value, use a direct selector without `useShallow` (e.g., `const a = useStore(s => s.a)`).
