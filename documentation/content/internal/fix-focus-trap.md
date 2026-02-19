# Fix: FocusTrap Not Isolating Input

## The Bug

`FocusTrap` did not actually trap input. When a modal wrapped in `FocusTrap` was shown:

1. Keypresses still reached components outside the trap (e.g., j/k navigated the list behind the modal)
2. Keybindings inside the trap didn't fire
3. Closing the trap left focus in limbo — it never returned to the previously focused component

## Root Cause

Three missing behaviors:

### 1. No scope for children

`FocusTrap` called `useFocus()` to register a node and `setTrap(id)` to mark the boundary, but it rendered `<>{children}</>` without providing `FocusNodeContext`. Its children registered as siblings or root nodes, not as descendants of the trap. The trap node was never in the active branch path, so `InputRouter` never encountered it during the path walk.

### 2. No focus transfer on mount

Focus stayed on whatever was focused before the trap appeared. Since the trap node wasn't an ancestor of the focused node, the `if (nodeId === trapNodeId) return` check in `InputRouter` was never reached. Input continued flowing through the original path.

### 3. No focus restoration on unmount

When the trap unmounted, all its children unregistered. `unregisterNode` moved focus to parent nodes as they were removed, eventually landing on `null`. The previously focused component was never re-focused.

## Fix

Three changes to `FocusTrap`:

```tsx
export function FocusTrap({ children }: FocusTrapProps) {
  const { id } = useFocus();
  const { setTrap, clearTrap } = useInputContext();
  const { focusFirstChild, getFocusedId, focusNode } = useFocusContext();
  const previousFocusRef = useRef<string | null>(getFocusedId());

  useEffect(() => {
    setTrap(id);
    focusFirstChild(id);       // 2. Move focus into the trap
    return () => {
      clearTrap(id);
      if (previousFocusRef.current) {
        focusNode(previousFocusRef.current);  // 3. Restore focus
      }
    };
  }, [id]);

  return (
    <FocusNodeContext.Provider value={id}>   {/* 1. Scope children */}
      {children}
    </FocusNodeContext.Provider>
  );
}
```

**Previous focus is captured during render** (`useRef(getFocusedId())`), not inside the effect. This prevents the ref from being overwritten if the effect re-runs due to dependency changes.

## Changes

- `src/core/input/FocusTrap.tsx` — added `FocusNodeContext.Provider`, `focusFirstChild` on mount, focus restore on unmount
