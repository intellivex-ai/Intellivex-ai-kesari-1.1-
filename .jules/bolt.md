## 2024-08-28 - Avoid Destructuring Zustand Store
**Learning:** Destructuring Zustand stores directly like `const { open } = useWorkspaceStore()` causes unnecessary re-renders when other state properties change.
**Action:** Use the `useShallow` hook from `zustand/react/shallow` to bundle multiple state slice subscriptions, or select atomic values directly (e.g. `const runCode = useWorkspaceStore(s => s.runCode)`).

## 2024-08-28 - Avoid Destructuring Zustand Store
**Learning:** Destructuring Zustand stores directly like `const { open } = useWorkspaceStore()` causes unnecessary re-renders when other state properties change.
**Action:** Use the `useShallow` hook from `zustand/react/shallow` to bundle multiple state slice subscriptions, or select atomic values directly (e.g. `const runCode = useWorkspaceStore(s => s.runCode)`).
