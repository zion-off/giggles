# Fix: Controlled Focus Lost on Re-render

## The Bug

In controlled `FocusGroup` (`value` prop set), no child ever appeared focused. The focused child would briefly receive focus during the initial effect, then silently lose it.

## Root Cause

`bindContextValue` in FocusGroup was computed inline without memoization:

```tsx
const bindContextValue = value ? { register, unregister } : null;
```

This created a new object reference on every render. Since `bindContext` is in the dependency array of `useFocus`'s effect, every FocusGroup re-render triggered:

1. Children's effects clean up → `unregisterNode` called → focus moves to parent
2. Children's effects re-run → `registerNode` called → but `nodes.size > 1`, so no auto-focus
3. FocusGroup's `value` effect does NOT re-run (deps unchanged) → nothing restores focus

Result: focus is silently moved to the parent node and never restored.

## Fix

Memoize `bindContextValue`:

```tsx
const bindContextValue = useMemo(
  () => (value ? { register, unregister } : null),
  [value, register, unregister]
);
```

`register` and `unregister` are already stable (`useCallback` with `[]` deps). The object is only recreated when `value` changes, which is intentional — the `value` effect also fires in that case and restores focus to the correct child.

## Changes

- `src/core/focus/FocusGroup.tsx` — memoized `bindContextValue`
