## 2024-05-24 - Zustand Destructuring Re-render Anti-pattern
**Learning:** Destructuring from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) subscribes the component to all store updates, triggering unnecessary re-renders on unrelated state changes.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.runCode)`) or `useShallow` from `zustand/react/shallow` for multiple properties to bundle subscriptions efficiently.
