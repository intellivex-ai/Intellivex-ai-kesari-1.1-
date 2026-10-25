## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2025-02-23 - useShallow for Zustand store destructuring
**Learning:** Destructuring directly from Zustand hooks (e.g. `const { a, b } = useStore()`) creates subscriptions to the entire store object, meaning the component will re-render whenever *any* state in the store updates, even properties not destructured. This leads to massive, unnecessary re-renders in larger components.
**Action:** Use `useShallow` from `zustand/react/shallow` to bundle state slice subscriptions when accessing multiple properties: `const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })))`. For single atomic values, use a raw selector: `const a = useStore(state => state.a)`.
