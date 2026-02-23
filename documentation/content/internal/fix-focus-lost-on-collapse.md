# Fix: Focus Lost When Collapsing a Directory (or Any Conditional FocusGroup)

## The Bug

In the file tree example, pressing `h` to collapse an open directory caused all focus to disappear. Nothing rendered green and no keybindings responded afterwards.

## Root Cause

When a `FocusGroup` and its children unmount (e.g. `{open && <FocusGroup>...}</FocusGroup>`), each node calls `unregisterNode`, which tries to reassign focus by returning `node.parentId` from a `setFocusedId` updater:

```ts
setFocusedId((current) => {
  if (current !== id) return current;
  return node.parentId ?? null; // <-- the problem
});
```

This relies on the updaters forming a correct chain. If the focused node was `D` (a leaf inside `C` inside `B`), the intended chain was:

```
D's updater: focusedId D → C
C's updater: focusedId C → B   ✓
```

But React does not guarantee that cleanup effects run children-before-parents. If `C`'s cleanup ran first:

```
C's updater: focusedId D ≠ C → no-op (D still focused)
D's updater: focusedId D → C   ✗ (C is already deleted from nodesRef)
```

`focusedId` ends up pointing to `C`, which no longer exists in the node map. `isFocused` walks from `C`, finds no entry, and returns `false` for every node. Everything goes dark.

## Fix

Added a `parentMapRef` that records every node's parent at registration time and is **never deleted from**:

```ts
const parentMapRef = useRef<Map<string, string | null>>(new Map());

// in registerNode:
parentMapRef.current.set(id, parentId);
```

The `setFocusedId` updater inside `unregisterNode` now walks `parentMapRef` to find the first ancestor that still exists in the live `nodesRef`, regardless of which ancestors have already been cleaned up:

```ts
setFocusedId((current) => {
  if (current !== id) return current;
  let candidate = node.parentId;
  while (candidate !== null) {
    if (nodesRef.current.has(candidate)) return candidate;
    candidate = parentMapRef.current.get(candidate) ?? null;
  }
  return null;
});
```

This makes focus recovery order-independent: whether React cleans up children before parents or parents before children, the updater always lands on the nearest living ancestor.

## Changes

- `src/core/focus/FocusContext.tsx` — added `parentMapRef`, record parent on `registerNode`, walk `parentMapRef` in `unregisterNode`'s updater
