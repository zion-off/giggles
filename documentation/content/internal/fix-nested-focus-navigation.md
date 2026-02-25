# Fix: Nested FocusGroup Navigation and FocusTrap Input Leak

## The Bugs

Three related issues prevented nested `FocusGroup` layouts (e.g., a dashboard with columns containing rows) from working correctly:

1. **`navigateSibling` operated on the wrong level.** An outer horizontal `FocusGroup` pressing `h`/`l` navigated among the focused leaf's siblings (rows) instead of among its own direct children (columns). Nested `FocusGroup`s of different directions couldn't coexist.

2. **`FocusTrap` didn't block input.** Keys like `j`/`k` passed straight through the trap boundary to parent `FocusGroup`s. A modal or drill-in panel couldn't isolate input.

3. **`focusFirstChild` stopped one level down.** `FocusTrap` and `navigateSibling` both called `focusFirstChild`, which focused the first child node — often a `FocusGroup` container, not the first interactive leaf. Focus landed on a group node with no way to navigate its children.

## Root Causes

### 1. `navigateSibling` used the global `focusedId`

`navigateSibling` looked up `focusedId`'s parent and navigated among its siblings. Every `FocusGroup` called the same function, so navigation always happened at the leaf level regardless of which group's keybinding fired.

```
Outer HFG (h/l) → navigateSibling('next')
                   ↓ uses focusedId = Row1
                   ↓ Row1.parent = Inner VFG
                   ↓ navigates among VFG's children (rows)
                   ✗ Should navigate among HFG's children (columns)
```

### 2. InputRouter skipped nodes without bindings

```typescript
// InputRouter.tsx — before fix
for (const nodeId of path) {
  const nodeBindings = getNodeBindings(nodeId);
  if (!nodeBindings) continue;  // ← skips FocusTrap entirely
  // ...
  if (nodeId === trapNodeId) return;  // ← never reached
}
```

`FocusTrap` registers a focus node but no keybindings. `getNodeBindings` returned null, the loop hit `continue`, and the trap check on line 39 was never evaluated.

### 3. `focusFirstChild` didn't recurse

```typescript
focusFirstChild(parentId) {
  focusNode(parent.childrenIds[0]);  // focused a FocusGroup node, not a leaf
}
```

When `FocusTrap` called `focusFirstChild(id)`, focus landed on the inner `FocusGroup` node. Since the `FocusGroup` wasn't the focused leaf's ancestor (it *was* the focused node), `h`/`l` navigation found no child in the active path and did nothing.

## Fixes

### `FocusContext.tsx` — `navigateSibling` accepts `groupId`

When `groupId` is provided, the function walks up from the focused leaf to find which direct child of that group contains focus, then navigates to the next/prev sibling at that level. If the target has children, it calls `focusFirstChild` to enter the group.

```typescript
navigateSibling(direction, wrap, groupId?) {
  if (groupId) {
    // Walk up from focusedId to find the direct child of groupId in the active path
    // Navigate among groupId's children
    // focusFirstChild(target) if target has children, focusNode(target) otherwise
  } else {
    // Original behavior (leaf's parent siblings)
  }
}
```

### `FocusGroup.tsx` — passes own `focus.id`

```typescript
const next = () => navigateSibling('next', wrap, focus.id);
const prev = () => navigateSibling('prev', wrap, focus.id);
```

### `FocusContext.tsx` — `focusFirstChild` drills to leaf

```typescript
focusFirstChild(parentId) {
  let target = parent.childrenIds[0];
  let targetNode = nodes.get(target);
  while (targetNode && targetNode.childrenIds.length > 0) {
    target = targetNode.childrenIds[0];
    targetNode = nodes.get(target);
  }
  focusNode(target);
}
```

### `InputRouter.tsx` — trap check runs unconditionally

```typescript
for (const nodeId of path) {
  const nodeBindings = getNodeBindings(nodeId);
  if (nodeBindings) {
    // check bindings, fallback handler
  }
  if (nodeId === trapNodeId) {
    return;  // always reached, even if node has no bindings
  }
}
```

## Changes

- `src/core/focus/FocusContext.tsx` — `navigateSibling` with `groupId`, recursive `focusFirstChild`
- `src/core/focus/FocusGroup.tsx` — passes `focus.id` to `navigateSibling`
- `src/core/input/InputRouter.tsx` — trap check independent of node bindings
