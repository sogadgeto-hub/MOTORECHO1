# ESLint React Hooks — Beta audit (Sprint 5.7)

Audited warnings from `npm run lint`. Only **real risks** were fixed; others are documented here.

## Fixed in Sprint 5.7

### `app/processing.tsx`

- **Issue:** Analysis effect used empty dependency array with stale closures; no unmount guard on async work.
- **Fix:** Analysis runs in a dedicated `useEffect` with explicit deps. `mountedRef` + `cancelled` flag prevent navigation/state updates after unmount. `analysisRunning` ref prevents concurrent runs.

## Intentionally left unchanged

### `app/recording.tsx` — AppState listener deps `[phase, abortRecordingDueToInterruption]`

- **Why:** Listener must react to `phase === 'recording'`. Re-subscribing when phase changes is intentional; cleanup removes the previous subscription.

### `app/recording.tsx` — pulse animation `[phase, pulseAnim]`

- **Why:** Animation should restart when entering/leaving recording phase.

### `app/(tabs)/settings.tsx` — `useEffect(() => load(), [])` without `load` dep

- **Why:** Initial mount only; `useFocusEffect` handles refresh on tab focus with `[load]` deps.

### `app/(tabs)/index.tsx`, `history.tsx` — fetch effects

- **Why:** Data loads on mount/focus; including unstable callbacks would cause duplicate fetches.

### `lib/auth.tsx` — auth bootstrap effect

- **Why:** Single bootstrap on provider mount; adding auth handlers risks re-init loops.

### `lib/subscription-engine/context.tsx` — RevenueCat bootstrap

- **Why:** Tied to `userId` only; `applyAccessState` is stable via `useCallback`.

## Verification

```bash
npm run lint
npm run typecheck
```
