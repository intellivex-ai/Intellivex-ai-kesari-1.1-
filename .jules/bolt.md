## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2024-05-18 - Zustand Selector Re-render Trap
**Learning:** Destructuring entire Zustand stores (e.g., `const { val } = useStore()`) is a critical anti-pattern in React. It subscribes the component to *every* change in the store, not just `val`, defeating optimizations like `React.memo` and causing widespread unnecessary UI re-renders, especially in large applications with frequent state changes (like this streaming chat app).
**Action:** Always use targeted selectors (e.g., `const val = useStore(s => s.val)`) when consuming Zustand stores in performance-sensitive React components to ensure they only re-render when their specific dependencies change.
