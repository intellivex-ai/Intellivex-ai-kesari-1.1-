## 2025-02-18 - Prevent Unnecessary Re-renders from Zustand Store Selectors
**Learning:** Default destructuring of Zustand store values (e.g., `const { a, b } = useStore()`) triggers a component re-render when *any* property in the entire store changes, even ones that aren't being destructured.
**Action:** When extracting multiple values, use `useShallow` from `zustand/react/shallow` to bundle state subscriptions. When extracting a single value, use an atomic selector (e.g., `useStore(state => state.value)`) without `useShallow`. This drastically prevents needless re-renders across the app.
