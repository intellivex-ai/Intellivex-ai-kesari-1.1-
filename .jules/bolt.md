## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.
## 2026-11-06 - Zustand Store Performance Optimization
**Learning:** Direct destructuring from Zustand stores triggers unnecessary component re-renders when unrelated state changes. Bundling state slice subscriptions with useShallow from 'zustand/react/shallow' or fetching individual values directly prevents this.
**Action:** Always use useShallow when selecting multiple items from a Zustand store. When selecting a single item, use the raw selector directly (e.g. state => state.item).
