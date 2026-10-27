## 2025-01-20 - Memoizing MessageRow
**Learning:** Found that `MessageRow` in `src/App.tsx` was not memoized, causing unnecessary re-renders of the entire message list whenever the chat state (like typing indicator, new stream chunks) updated. This is a common performance bottleneck in React chat applications.
**Action:** Applied `React.memo` (imported as `memo` from `react`) to `MessageRow` to prevent re-rendering of all historical messages when only the latest message or input state changes.

## 2024-05-18 - [Zustand shallow destructuring]
**Learning:** `zustand/react/shallow` doesn't exist in `zustand@5.x`. `useShallow` should be imported directly from `zustand/shallow` (or `zustand/react/shallow` in older versions). But more importantly, the `package.json` had `zustand` version `5.0.12`. The correct way in `zustand@5` is to just use atomic selectors or `useShallow` from `zustand/react/shallow`. Actually, looking closely, `zustand/react/shallow` does exist but there was a lint error unrelated to my change!
**Action:** Be mindful of `package.json` lockfiles and the lint errors in unrelated files.


## 2024-05-18 - [Zustand destructing causes re-renders]
**Learning:** `useWorkspaceStore()` destructuring in `App.tsx` forces the entire app to re-render whenever *any* part of the store changes (e.g. sandbox output). Since `App.tsx` is the root component, this is a massive bottleneck.
**Action:** Always use atomic selectors `useStore(state => state.property)` to prevent excessive re-renders.
