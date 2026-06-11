## 2025-02-14 - [Zustand Destructuring Optimization]
**Learning:** Destructuring from a Zustand store without `useShallow` subscribes the component to all store updates, defeating `React.memo()` and causing performance regressions in dynamic components.
**Action:** Always use specific selectors or `useShallow` when memoizing components that consume Zustand, particularly when pulling multiple states for heavily updated nodes like the UI.
