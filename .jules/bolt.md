## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2026-06-01 - Zustand Anti-Pattern: Destructuring Defeats Memoization
**Learning:** Destructuring from a Zustand store (e.g., `const { runCode } = useWorkspaceStore()`) without a selector subscribes the component to all store updates, defeating `React.memo()`. This causes unnecessary O(N) re-renders, especially during rapid state changes like streaming tokens.
**Action:** Always use specific selectors (e.g., `useWorkspaceStore(s => s.runCode)`) for single properties, or `useShallow` from `zustand/react/shallow` (e.g., `useWorkspaceStore(useShallow(s => ({ a: s.a, b: s.b })))`) for multiple properties when consuming Zustand stores in React components.
