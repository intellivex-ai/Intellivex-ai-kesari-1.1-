## 2024-05-24 - Zustand Direct Destructuring Anti-pattern
**Learning:** Destructuring directly from Zustand hooks (e.g., `const { a, b } = useStore()`) is a major performance anti-pattern in React. It causes the component to subscribe to the entire store, triggering re-renders whenever *any* unrelated state changes.
**Action:** Always use atomic selectors for single values (e.g., `useStore(state => state.value)`) or `useShallow` from `zustand/react/shallow` for multiple values to tightly scope subscriptions and prevent unnecessary re-renders.
