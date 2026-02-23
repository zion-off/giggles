# Architecture: External Focus Store

Decouple the focus tree from React's context mechanism. The current system forces a two-component split on every focusable unit because hooks cannot read context set by a provider rendered in the same component. The external store eliminates this constraint.

## Foundational Constraints

**React runs effects bottom-up.** Children's `useEffect` cleanup and setup fire before parents'. Leaf nodes register in the store before their parent scopes. This is not an edge case to work around — it is the assumed default. Every lifecycle decision in the store (registration, unregistration, focus recovery) must be correct under this ordering.

**Bubbletea is the conceptual reference.** [charmbracelet/bubbletea](https://github.com/charmbracelet/bubbletea) uses the Elm architecture: messages flow down, updates bubble up, and the focused model is the only one that receives input. Our active branch path + InputRouter is the React translation of this. Passive scopes are our version of a model yielding control back to its parent. When in doubt about a design decision, ask: how would Bubbletea handle this? Then translate into React idioms.

---

## Store

A plain TypeScript class. No React dependency. Testable in isolation.

```
FocusStore
├── nodes: Map<string, FocusNode>         // The tree
├── parentMap: Map<string, string | null>  // Persistent parent record (never deleted from)
├── focusedId: string | null
├── passiveSet: Set<string>
├── pendingFocusFirstChild: Set<string>    // Queued focusFirstChild requests
├── keybindings: Map<string, Map<string, BindingRegistration>>  // nodeId → registrationId → bindings
├── trapNodeId: string | null
├── listeners: Set<() => void>
├── subscribe(listener) → unsubscribe
├── registerNode(id, parentId)
├── unregisterNode(id)
├── focusNode(id)
├── focusFirstChild(parentId)
├── navigateSibling(direction, wrap, groupId, shallow?)
├── dispatch(input, key)               // Input dispatch algorithm
├── registerKeybindings(nodeId, registrationId, bindings, options)
├── unregisterKeybindings(nodeId, registrationId)
├── getNodeBindings(nodeId)
├── getActiveBranchPath() → string[]
├── setTrap(nodeId) / clearTrap(nodeId)
├── isFocused(id) → boolean             // Ancestor walk, not exact match
└── isPassive(id) → boolean
```

The store is provided via React context (not a module-level singleton). This allows isolated trees in tests — each test gets its own store instance. `GigglesProvider` creates the store and provides it.

### isFocused: Ancestor Walk

`isFocused(id)` does not check `id === focusedId`. It walks from `focusedId` up through ancestors. Returns `true` if `id` is the focused node OR any ancestor of the focused node. This makes `scope.hasFocus` mean "something inside me has focus" for scope nodes, while remaining equivalent to exact match for leaf nodes (which have no children).

```ts
isFocused(id: string): boolean {
  if (!this.focusedId) return false;
  let cursor: string | null = this.focusedId;
  while (cursor) {
    if (cursor === id) return true;
    const node = this.nodes.get(cursor);
    cursor = node?.parentId ?? null;
  }
  return false;
}
```

### focusNode: Passive Transitions

`focusNode` is the most complex method because it handles passive scope transitions.

```ts
focusNode(id: string) {
  if (!this.nodes.has(id)) return;
  const oldFocusedId = this.focusedId;
  if (oldFocusedId === id) return;

  this.focusedId = id;

  // Clear passive flags for scopes that focus is leaving or entering
  for (const passiveId of this.passiveSet) {
    const wasAncestor = this.isAncestorOf(passiveId, oldFocusedId);
    const isAncestor = this.isAncestorOf(passiveId, id);

    // Focus left the passive scope's subtree → clear
    if (wasAncestor && !isAncestor) {
      this.passiveSet.delete(passiveId);
    }
    // Focus entered a descendant of the passive scope → clear (drill-in)
    if (isAncestor && id !== passiveId) {
      this.passiveSet.delete(passiveId);
    }
  }

  this.notify();
}

// Helper: is `ancestor` an ancestor of `descendant`? (or equal)
private isAncestorOf(ancestor: string, descendant: string | null): boolean {
  let cursor = descendant;
  while (cursor) {
    if (cursor === ancestor) return true;
    const node = this.nodes.get(cursor);
    cursor = node?.parentId ?? null;
  }
  return false;
}
```

### Keybinding Registry is Logically Separate from the Node Tree

Keybindings can exist for a node ID that has not yet registered in the node tree. This is required because keybindings register synchronously during render, but nodes register in `useEffect` (which fires after render). During the window between render and effect, a node has keybindings but no tree entry. This is safe because the InputRouter only walks nodes that exist in the active branch path — a keybinding for a non-existent node is never reached during dispatch.

The keybinding map (`Map<string, Map<string, BindingRegistration>>`) uses the same two-level structure as the current `InputContext`: `nodeId → registrationId → BindingRegistration`. Multiple `useKeybindings` calls on the same node are supported. Each call gets a unique `registrationId` (from `useId()`). Bindings merge in insertion order — later registrations override earlier ones for the same key. This is unchanged from the current system.

### React Integration

```
React layer
├── StoreContext: Context<FocusStore>       (store instance, provided by GigglesProvider)
├── ScopeIdContext: Context<string | null>  (parent discovery, just a string)
├── InputRouter component                   (bridges Ink's useInput to store.dispatch)
├── useSyncExternalStore                    (reactive reads)
└── useEffect                              (mount/unmount registration, internal only)
```

`InputRouter` remains a React component. It calls Ink's `useInput` hook and forwards keypresses to `store.dispatch(input, key)`. The dispatch algorithm lives in the store — InputRouter is just the bridge.

### Snapshot Stability

`useSyncExternalStore` compares snapshots with `Object.is`. Snapshots must be primitives. Each reactive value (`hasFocus`, `isPassive`) uses a separate `useSyncExternalStore` subscription with its own `getSnapshot` closure.

```ts
// Inside useFocusScope:
const hasFocus = useSyncExternalStore(store.subscribe, () => store.isFocused(id));
const isPassive = useSyncExternalStore(store.subscribe, () => store.isPassive(id));
```

Every node subscribes to the store. A focus change triggers O(n) `getSnapshot` calls, but each returns a boolean — React compares with `Object.is` and only re-renders the nodes whose value actually changed (typically 2 per focus move). This is negligible for TUI trees.

---

## Developer API

### `useFocusScope(options?)`

Creates a scope node in the focus tree. Returns a handle with reactive focus state.

```ts
type FocusScopeHandle = {
  id: string;
  hasFocus: boolean;    // true if this scope or any descendant has focus (ancestor walk)
  isPassive: boolean;   // true if this scope has been escaped from
};

type FocusScopeOptions = {
  parent?: FocusScopeHandle;  // explicit parent (same-component usage)
  keybindings?: Keybindings | ((helpers: FocusScopeHelpers) => Keybindings);
};
```

When `parent` is omitted, the scope reads its parent from `ScopeIdContext`.

When `parent` is provided, the scope registers directly under that parent in the store, bypassing context. This is for creating a scope in the same component as its parent.

A scope with no `keybindings` is valid — it acts as a pure grouping mechanism. A keyless scope is transparent to input dispatch: the router finds no matching binding and continues walking up to the parent. Keys pass through.

`FocusScopeHandle` is a value object. A new object is returned on every render (because `hasFocus` and `isPassive` are reactive). Do not use the handle object itself in `useEffect` dependency arrays — use `handle.id` (stable) or specific properties.

**Keybinding closures are fresh every render.** `useFocusScope` re-registers keybindings synchronously on every render. User-provided handler functions capture values at render time. This is intentional — closures are never stale.

**Internally**, `useFocusScope` creates a node (like `useFocusNode`), builds the navigation helpers (`next`, `prev`, `escape`, etc.), resolves the keybindings (calling the callback if it's a function), and calls `useKeybindings` on its own handle. This follows the same pattern as the current `FocusGroup.tsx`.

### `<FocusScope handle={scope}>`

A stable React component that sets `ScopeIdContext` for its children. This is how child components discover their parent scope implicitly.

`<FocusScope>` is defined once as a normal component — not returned from a hook. Its core job is `<ScopeIdContext.Provider value={handle.id}>{children}</ScopeIdContext.Provider>`. In dev mode, it also registers a flag in the store (via `useEffect`) to enable the duplicate/missing checks described below.

**Every `useFocusScope` call must have a corresponding `<FocusScope>` in the render output.** If `<FocusScope>` is omitted, the scope node exists in the store but children will register under the grandparent scope via context — a silent bug. In dev mode, `<FocusScope>` registers a flag in the store on mount and clears it on unmount. `useFocusScope` checks for this flag in a `useEffect` after the commit and warns if missing.

**A handle must not be passed to more than one `<FocusScope>`.** If two `<FocusScope>` components share a handle, two React subtrees set `ScopeIdContext` to the same ID. Children of both register under the same parent node, creating a phantom branch. In dev mode, `<FocusScope>` throws if a second instance mounts with the same `handle.id` as an existing one.

```tsx
function Panel() {
  const scope = useFocusScope({
    keybindings: ({ next, prev, escape }) => ({
      j: next, k: prev, h: escape
    })
  });

  return (
    <FocusScope handle={scope}>
      <Box borderColor={scope.hasFocus ? 'green' : undefined}>
        <Select options={items} value={selected} onChange={setSelected} />
      </Box>
    </FocusScope>
  );
}
```

### `useFocusNode(options?)`

Creates a leaf node in the focus tree. Used by framework components (Select, TextInput, Viewport) internally.

```ts
type FocusNodeHandle = {
  id: string;
  hasFocus: boolean;
};

type FocusNodeOptions = {
  parent?: FocusScopeHandle;  // explicit parent (same-component usage)
};
```

Implicit parent (context):
```tsx
function SelectInternal() {
  const focus = useFocusNode();
  useKeybindings(focus, { j: next, k: prev, enter: select });
}
```

Explicit parent (same component):
```tsx
function MyComponent() {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ j: next, k: prev })
  });
  const a = useFocusNode({ parent: scope });
  const c = useFocusNode({ parent: scope });

  return (
    <FocusScope handle={scope}>
      <Box borderColor={a.hasFocus ? 'green' : undefined}>A</Box>
      <Box>B (presentational)</Box>
      <Box borderColor={c.hasFocus ? 'green' : undefined}>C</Box>
    </FocusScope>
  );
}
```

### Multiple Scopes in One Component

```tsx
function Dashboard() {
  const root = useFocusScope({
    keybindings: ({ next, prev }) => ({ l: next, h: prev })
  });
  const sidebar = useFocusScope({ parent: root, keybindings: ... });
  const main = useFocusScope({ parent: root, keybindings: ... });

  return (
    <FocusScope handle={root}>
      <FocusScope handle={sidebar}>
        <Box borderColor={sidebar.hasFocus ? 'green' : undefined}>
          <FileList />
        </Box>
      </FocusScope>

      <Box>Status bar (presentational)</Box>

      <FocusScope handle={main}>
        <Box borderColor={main.hasFocus ? 'green' : undefined}>
          <Editor />
        </Box>
      </FocusScope>
    </FocusScope>
  );
}
```

---

## Navigation Helpers

Provided to `useFocusScope`'s keybindings callback:

| Helper | Behavior |
|--------|----------|
| `next` | Navigate to next sibling. Auto-drills into first leaf. |
| `prev` | Navigate to previous sibling. Auto-drills into first leaf. |
| `nextShallow` | Navigate to next sibling. Lands on scope node, no drill. |
| `prevShallow` | Same, backwards. |
| `escape` | Focus own scope node, mark passive. Parent's bindings take over. |
| `drillIn` | Focus first child of the currently focused node. Clears passive. |

`next`/`prev` and `nextShallow`/`prevShallow` both call `store.navigateSibling(direction, wrap, groupId, shallow)`. When `shallow` is false (default), the target sibling is resolved to its deepest first leaf via `focusFirstChild`. When `shallow` is true, the target sibling's scope node is focused directly.

### Auto-drill vs Shallow Navigation

**Auto-drill (panel switching).** `next`/`prev` land on the first leaf inside the sibling. For dashboards — press a key and you're immediately inside the other panel.

```tsx
keybindings: ({ next, prev }) => ({ l: next, h: prev })
```

**Shallow navigation (hierarchical browsing).** `nextShallow`/`prevShallow` land on the sibling's scope node without drilling in. For file trees — browse at each level before deciding to enter.

```tsx
keybindings: ({ nextShallow, prevShallow, escape, drillIn }) => ({
  j: nextShallow, k: prevShallow, h: escape, l: drillIn
})
```

---

## Passive Scopes

### The Problem

When the same keys (e.g., j/k) are bound at multiple nesting levels, inner scopes shadow outer scopes. The InputRouter walks the active branch path bottom-up and stops at the first match. If a child scope binds `j` and the parent also binds `j`, the parent's binding never fires.

### The Solution

A `Set<string>` in the store tracks passive scope IDs. The InputRouter skips passive scopes during dispatch.

**Transitions:**

| Trigger | Effect |
|---------|--------|
| `escape()` called on scope S | S added to passive set. `focusNode(S.id)` called. |
| Focus moves to a descendant of passive scope S (not S itself) | S removed from passive set. |
| Focus moves from inside S's subtree to a node outside S's subtree | S removed from passive set. |
| Scope S unmounts (`unregisterNode`) | S removed from passive set. |

"Focus leaving a passive scope" means precisely: the old `focusedId` was the scope's own node or a descendant of the scope, and the new `focusedId` is not the scope and is not a descendant of the scope. The store handles both "leaving" and "entering" transitions inside `focusNode()` — see the `focusNode` implementation above.

### Trace

```
Root (scope, binds j/k)
├── Sidebar (scope, binds j/k/escape)
│   ├── Item1 (leaf)
│   └── Item2 (leaf)
└── Main (scope, binds j/k/escape)
    ├── Tab1 (leaf)
    └── Tab2 (leaf)
```

1. **Focus: Item1.** Path: `[Item1, Sidebar, Root]`. Press `j` → Sidebar's `next` → Item2.
2. **Press escape.** Sidebar becomes passive. Focus on Sidebar node. Path: `[Sidebar(passive), Root]`.
3. **Press `j`.** Sidebar is passive — skipped. Root's `next` fires → auto-drills into Main → Tab1. Sidebar's passive flag clears (focus left Sidebar's subtree). Main is active.
4. **Press `j`.** Path: `[Tab1, Main, Root]`. Main's `next` → Tab2.
5. **Press escape.** Main passive. Press `j` → Root's `next` → auto-drills into Sidebar → Item1. Main's passive flag clears.

Same keys at every level. No shadowing.

### `hasFocus` and `isPassive`

A passive scope has `hasFocus = true` (focus is on its node) but `isPassive = true`. The developer should render this state visually — otherwise the user has no feedback that they've escaped and the parent's navigation is active:

```tsx
const borderColor = scope.isPassive ? 'yellow' : scope.hasFocus ? 'green' : undefined;
```

---

## Input Dispatch

The dispatch algorithm lives in `store.dispatch(input, key)`. The `InputRouter` React component bridges Ink's `useInput` to this method.

1. Normalize the keypress via `normalizeKey(input, key)`.
2. Walk the active branch path (focused node up to root). For each node:
   a. If node is in the passive set → skip.
   b. If node has capture mode active and key is not in passthrough → call `onKeypress`, stop.
   c. If node has a matching keybinding with `when !== 'mounted'` → call handler, stop.
   d. If node is the trap node → stop.
3. If no handler found, check all bindings with `when: 'mounted'`. Fire first match.

---

## Registration and Effect Ordering

### Synchronous Keybinding Registration

Keybindings register synchronously during render, not in `useEffect`. Both `useFocusScope` (for scope bindings) and `useKeybindings` (for leaf bindings) call `store.registerKeybindings()` during the render phase. Unregistration happens in `useEffect` cleanup. This ensures bindings are always available for the next keypress.

### Node Registration in useEffect

Node registration (adding to the store's node Map) happens in `useEffect`. React fires effects children-first: leaves register before their parent scopes.

When a leaf registers with `parentId = scope.id` but the scope hasn't registered yet, the leaf is an orphan. When the scope later registers, it scans existing nodes and adopts any whose `parentId` matches. This is the reverse-scan pattern.

```ts
registerNode(id: string, parentId: string | null) {
  const node: FocusNode = { id, parentId, childrenIds: [] };
  this.nodes.set(id, node);
  this.parentMap.set(id, parentId);

  // Link to parent if it exists already
  if (parentId) {
    const parent = this.nodes.get(parentId);
    if (parent && !parent.childrenIds.includes(id)) {
      const wasEmpty = parent.childrenIds.length === 0;
      parent.childrenIds.push(id);

      // Fulfill pending focusFirstChild
      if (wasEmpty && this.pendingFocusFirstChild.has(parentId)) {
        this.pendingFocusFirstChild.delete(parentId);
        this.focusNode(id);
      }
    }
  }

  // Reverse-scan: adopt orphaned children that registered before us
  for (const [existingId, existingNode] of this.nodes) {
    if (existingNode.parentId === id && !node.childrenIds.includes(existingId)) {
      node.childrenIds.push(existingId);
    }
  }

  // Auto-focus the first node in the tree
  if (this.nodes.size === 1) {
    this.focusNode(id);
  }

  this.notify();
}
```

### Pending focusFirstChild

`focusFirstChild(parentId)` may be called before the parent has any children (e.g., FocusTrap mounts and calls `focusFirstChild` in its effect, but the trap's children haven't registered yet). When this happens, the request is queued in `pendingFocusFirstChild: Set<string>`. When the first child registers under that parent, the pending request is fulfilled and the child receives focus.

```ts
focusFirstChild(parentId: string) {
  const parent = this.nodes.get(parentId);
  if (parent && parent.childrenIds.length > 0) {
    // Drill to deepest first child
    let target = parent.childrenIds[0];
    let targetNode = this.nodes.get(target);
    while (targetNode && targetNode.childrenIds.length > 0) {
      target = targetNode.childrenIds[0];
      targetNode = this.nodes.get(target);
    }
    this.focusNode(target);
  } else {
    this.pendingFocusFirstChild.add(parentId);
  }
}
```

### Unregistration

```ts
unregisterNode(id: string) {
  const node = this.nodes.get(id);
  if (!node) return;

  // 1. Remove from parent's childrenIds
  if (node.parentId) {
    const parent = this.nodes.get(node.parentId);
    if (parent) {
      parent.childrenIds = parent.childrenIds.filter(c => c !== id);
    }
  }

  // 2. Delete from node map
  this.nodes.delete(id);

  // 3. Clear passive flag
  this.passiveSet.delete(id);

  // 4. Clear pending focusFirstChild
  this.pendingFocusFirstChild.delete(id);

  // 5. Refocus if this node was focused
  // Walk parentMap (persistent, never deleted from) to find nearest living ancestor
  if (this.focusedId === id) {
    let candidate = node.parentId;
    while (candidate !== null) {
      if (this.nodes.has(candidate)) {
        this.focusNode(candidate);
        return;
      }
      candidate = this.parentMap.get(candidate) ?? null;
    }
    this.focusedId = null;
  }

  this.notify();
}
```

### Child Ordering

`childrenIds` reflects registration order, which matches React's effect execution order for static children. React processes sibling effects in JSX order (left to right), so `childrenIds` matches the visual order.

**Limitation:** If children are conditionally rendered (appear after initial mount), they append to `childrenIds` in mount order, not JSX order. Navigation order may not match visual order for dynamic children. This is a known limitation. For dynamic lists, use a single scope with a flat list of items rather than conditionally mounting individual scopes.

---

## FocusTrap Interaction

FocusTrap creates a boundary that prevents input from bubbling past it.

**On mount:**
1. Save current `focusedId`.
2. Call `store.setTrap(id)`.
3. Call `store.focusFirstChild(id)` — if children haven't registered yet, this queues via `pendingFocusFirstChild`.

**On unmount:**
1. Call `store.clearTrap(id)`.
2. Restore focus to the saved node.

The InputRouter stops walking the active path at the trap node (step 2d in dispatch). Passive scopes outside the trap are irrelevant — the path walk never reaches them.

If the saved node's scope was passive before the trap opened, it remains passive after the trap closes. The trap does not change scope state.

---

## Dev-Mode Checks

1. **Missing `<FocusScope>`.** If `useFocusScope` registers a scope node but no `<FocusScope handle={...}>` mounts with that ID in the same commit, warn. Detected by having `<FocusScope>` register a flag in the store on mount; `useFocusScope` checks for this flag in a `useEffect` after the commit.

2. **Duplicate `<FocusScope>`.** If two `<FocusScope>` components mount with the same `handle.id`, throw. The store tracks which scope IDs have an active provider via a `Set<string>`. `<FocusScope>` adds to this set on mount and removes on unmount.

---

## Implementation Chunks

Sequential. Each chunk depends on the previous.

1. **`FocusStore` class.** Implement the store with all methods: `registerNode`, `unregisterNode`, `focusNode` (with passive transitions), `focusFirstChild` (with pending queue), `navigateSibling` (with `shallow` parameter), `isFocused`, `isPassive`, `getActiveBranchPath`, `subscribe`/`notify`. Pure TypeScript, no React.

2. **`useFocusScope`, `useFocusNode`, `<FocusScope>`.** The React hooks and component. Wire up `useId`, `useEffect` for registration, `useSyncExternalStore` for reactive reads. Provide `StoreContext` and `ScopeIdContext`. Explicit parent support.

3. **Move keybinding registry into the store.** Migrate `registerKeybindings`, `unregisterKeybindings`, `getNodeBindings` from `InputContext` into `FocusStore`. Keep synchronous registration during render. Update `useKeybindings` to call the store directly.

4. **Move input dispatch into the store.** Implement `store.dispatch(input, key)` with the passive-skip step. Slim `InputRouter` down to a bridge: `useInput((input, key) => store.dispatch(input, key))`. Remove `InputContext` and `FocusContext`.

5. **Navigation helpers and `useFocusScope` keybindings.** Build `next`, `prev`, `nextShallow`, `prevShallow`, `escape`, `drillIn` inside `useFocusScope`. Wire the `keybindings` option (plain object and callback form). Update `FocusTrap` to use the store.

6. **Migrate UI components and playground.** Update Select, TextInput, Viewport, Autocomplete, MultiSelect, Confirm, CommandPalette, Modal to use `useFocusNode` from the store. Rewrite `playground/View.tsx` using `useFocusScope` + `<FocusScope>`. Update all documentation examples.
