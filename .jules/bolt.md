## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2026-11-05 - Add useShallow to Zustand selectors
**Learning:** Found that components subscribing to multiple Zustand state variables (like WorkspacePanel) without useShallow were unnecessarily re-rendering when other state variables changed.
**Action:** Applied useShallow from 'zustand/react/shallow' to combine multiple subscriptions into a single shallowly compared object, preventing unnecessary re-renders.
