## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-05-22 - Zustand useShallow Optimization
**Learning:** Destructuring multiple fields from a Zustand store using  (from `zustand/react/shallow`) is critical for preventing unnecessary full-component re-renders while keeping the code clean, but must be paired with comments explaining the optimization as per my constraints.
**Action:** Use `useShallow` when selecting multiple properties from a Zustand store, and always add explicit inline comments explaining the optimization intent.
## 2026-05-22 - Zustand useShallow Optimization
**Learning:** Destructuring multiple fields from a Zustand store using useShallow (from zustand/react/shallow) is critical for preventing unnecessary full-component re-renders while keeping the code clean, but must be paired with comments explaining the optimization as per my constraints.
**Action:** Use useShallow when selecting multiple properties from a Zustand store, and always add explicit inline comments explaining the optimization intent.
