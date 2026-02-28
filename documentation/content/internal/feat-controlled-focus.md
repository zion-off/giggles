# Feature: Controlled Focus (`focusKey` + `focusChild`)

## Problem

The focus system only supports relative navigation (`next`, `prev`, `drillIn`, `escape`). There is no way for a parent scope to focus a specific child by identity. This blocks use cases like:

- Press `5` to jump to the fifth box in a dashboard
- Focus a specific panel when mounting a screen
- Restore focus to a previously-active child based on state

The internal `store.focusNode(id)` already exists and works. The gap is purely in the public API: node IDs are auto-generated and opaque, and there is no way to name a child or address it from outside.

## Design Decisions

- **Key-based identity, not index-based.** Indices shift when children are added, removed, or conditionally rendered, and visual index does not equal focus-tree index (non-focusable components are invisible to the store). Keys are stable identifiers declared by the child.
- **Keys are scoped to the immediate parent scope.** No global namespace. Two sibling scopes may both have a child keyed `'input'` without collision.
- **Duplicate keys in the same scope:** last registration silently wins (last `useEffect` to run overwrites the earlier entry). No warning.
- **`focusKey` is the name everywhere** — in hook options and component props — for consistency. `key` is not used because it is reserved as a React prop and would create a context-dependent naming rule.
- **`FocusNodeOptions` stays internal.** Not added to the public export surface. Consumers forwarding focus configuration type their own prop as `focusKey?: string`.
- **`Modal` and `CommandPalette` do not expose `focusKey`.** Their internal `useFocusNode` calls are implementation details of `FocusTrap`. Modals are opened imperatively via state, not navigated to as children.

---

## API

### Children declare a key

```ts
// Leaf node
const node = useFocusNode({ focusKey: 'search' })

// Scope node
const scope = useFocusScope({ focusKey: 'sidebar' })

// UI components — new prop forwarded to internal useFocusNode
<TextInput focusKey="search" />
<Select focusKey="results" options={...} />
<MultiSelect focusKey="tags" options={...} />
<Autocomplete focusKey="lookup" options={...} />
<Confirm focusKey="confirm" />
<Viewport focusKey="content" />
```

### Parent calls `focusChild` / `focusChildShallow`

Available in two places — keybinding factory helpers and the scope handle:

```ts
// In keybindings factory (most common)
const scope = useFocusScope({
  keybindings: ({ focusChild, focusChildShallow }) => ({
    's': () => focusChild('search'),
    'r': () => focusChild('results'),
    // drill: land on scope node, don't enter
    'S': () => focusChildShallow('sidebar'),
  })
})

// On the handle (for effects, event handlers outside keybindings)
const scope = useFocusScope()
useEffect(() => {
  if (searchOpen) scope.focusChild('search')
}, [searchOpen])
```

### Behavior

**`focusChild(key)`** — finds the direct child of this scope with the given key, then calls `focusFirstChild` on it (drills to deepest first leaf). Consistent with how `next()` works. If the target is a leaf node, it is focused directly. If the key is not found, no-op.

**`focusChildShallow(key)`** — finds the direct child with the given key, calls `focusNode` on it directly (lands on the scope node without drilling). Consistent with how `nextShallow()` works. If the key is not found, no-op.

Note: `focusChildShallow` will not clear passive state on the target scope. This is consistent with `nextShallow` behavior — landing on a scope node does not constitute entering it.

---

## FocusStore Changes

### New data structure: `keyIndex`

Add a `Map<parentId, Map<focusKey, childId>>` to the store. This is separate from the node tree — it is a lookup index maintained in parallel.

```ts
private keyIndex: Map<string, Map<string, string>> = new Map()
// keyIndex.get(parentId)?.get(focusKey) → childId
```

### `registerNode` — extend to accept and index `focusKey`

```ts
registerNode(id: string, parentId: string | null, focusKey?: string): void
```

After the existing node registration logic, if `focusKey` is provided:

```ts
if (focusKey && parentId) {
  if (!this.keyIndex.has(parentId)) {
    this.keyIndex.set(parentId, new Map())
  }
  this.keyIndex.get(parentId)!.set(focusKey, id)
}
```

**Effect ordering note:** Children's `useEffect` runs before parents' (React fires effects bottom-up). When a child with `focusKey` registers, its parent scope may not have registered in the node tree yet — but `parentId` is known as a string at call time. Using `parentId` as the first-level key in `keyIndex` (not the parent node object) means the key entry can be written immediately, regardless of whether the parent has registered yet. This is correct and safe.

### `unregisterNode` — clean up `keyIndex`

When a node unregisters, remove it from its parent's key map:

```ts
// After existing removal logic, add:
if (parentId) {
  const parentKeys = this.keyIndex.get(parentId)
  if (parentKeys) {
    for (const [key, childId] of parentKeys) {
      if (childId === id) {
        parentKeys.delete(key)
        break
      }
    }
    if (parentKeys.size === 0) {
      this.keyIndex.delete(parentId)
    }
  }
}
```

Also clean up the scope's own key map when it is itself unregistered (it will never be a parent again):

```ts
this.keyIndex.delete(id)
```

### New method: `focusChildByKey(parentId, key, shallow)`

```ts
focusChildByKey(parentId: string, key: string, shallow: boolean): void {
  const childId = this.keyIndex.get(parentId)?.get(key)
  if (!childId) return
  if (!this.nodes.has(childId)) return

  if (shallow) {
    this.focusNode(childId)
  } else {
    const child = this.nodes.get(childId)!
    if (child.childrenIds.length > 0) {
      this.focusFirstChild(childId)
    } else {
      this.focusNode(childId)
    }
  }
}
```

**Pending queue note:** If the target child is a scope with no children registered yet (e.g. a panel that's mounting), calling `focusFirstChild(childId)` will queue the request via `pendingFocusFirstChild` — the same mechanism used by `drillIn()`. This is free behavior from reusing `focusFirstChild`.

---

## `useFocusNode` Changes

### Options type

```ts
type FocusNodeOptions = {
  parent?: FocusScopeHandle
  focusKey?: string
}
```

### Registration

Pass `focusKey` through to `store.registerNode`:

```ts
store.registerNode(id, parentId, options?.focusKey)
```

---

## `useFocusScope` Changes

### Options type

```ts
type FocusScopeOptions = {
  parent?: FocusScopeHandle
  focusKey?: string
  keybindings?: Keybindings | ((helpers: FocusScopeHelpers) => Keybindings)
}
```

### Registration

```ts
store.registerNode(id, parentId, options?.focusKey)
```

### `FocusScopeHandle` — new methods

```ts
type FocusScopeHandle = {
  id: string
  hasFocus: boolean
  isPassive: boolean
  next(): void
  prev(): void
  nextShallow(): void
  prevShallow(): void
  escape(): void
  drillIn(): void
  focusChild(key: string): void       // NEW
  focusChildShallow(key: string): void // NEW
}
```

Implementation inside `useFocusScope`:

```ts
const focusChild = useCallback((key: string) => {
  store.focusChildByKey(id, key, false)
}, [store, id])

const focusChildShallow = useCallback((key: string) => {
  store.focusChildByKey(id, key, true)
}, [store, id])
```

### `FocusScopeHelpers` — extend the `Pick`

`FocusScopeHelpers` is a `Pick` over `FocusScopeHandle`. It is **not** automatically extended when new methods are added to the handle. The `Pick` must be explicitly updated:

```ts
export type FocusScopeHelpers = Pick<
  FocusScopeHandle,
  | 'next'
  | 'prev'
  | 'nextShallow'
  | 'prevShallow'
  | 'escape'
  | 'drillIn'
  | 'focusChild'        // ADD
  | 'focusChildShallow' // ADD
>
```

`FocusScopeHelpers` is exported from `src/core/focus/index.ts` and re-exported from `src/index.ts`. Adding new keys is backward-compatible — callers that don't destructure `focusChild` are unaffected.

---

## UI Component Changes

Each component that uses `useFocusNode` internally (except `Modal` and `CommandPalette`) gains a `focusKey` prop:

| Component | Change |
|-----------|--------|
| `TextInput` | Add `focusKey?: string` to props; pass to `useFocusNode({ focusKey })` |
| `Select` | Same |
| `MultiSelect` | Same |
| `Autocomplete` | Same |
| `Confirm` | Same |
| `Viewport` | Same |
| `Modal` | No change — internal trap node, not user-navigable |
| `CommandPalette` | No change — internal trap node, not user-navigable |

---

## Public API Export Changes

`FocusScopeOptions` already exported — the new `focusKey` field is a backward-compatible addition.

`FocusScopeHelpers` already exported — extending the `Pick` is backward-compatible.

`FocusNodeOptions` is **not** added to the public export. It remains internal.

No other export surface changes are required. The new `focusChild`/`focusChildShallow` methods appear on `FocusScopeHandle`, which is already exported.

---

## Implementation Order

1. **`FocusStore`** — add `keyIndex`, extend `registerNode(id, parentId, focusKey?)` and `unregisterNode` to maintain it, add `focusChildByKey(parentId, key, shallow)`.

2. **`useFocusNode`** — extend `FocusNodeOptions` with `focusKey`, pass through to `store.registerNode`.

3. **`useFocusScope`** — extend `FocusScopeOptions` with `focusKey`, pass through to `store.registerNode`, add `focusChild`/`focusChildShallow` to the handle and update the `FocusScopeHelpers` Pick.

4. **UI components** — add `focusKey` prop to `TextInput`, `Select`, `MultiSelect`, `Autocomplete`, `Confirm`, `Viewport`.

5. **Type-check** — `npx tsc --noEmit` from the repo root (docs workspace resolves from `dist/`, so `pnpm build` must be run before checking docs).
