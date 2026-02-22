# Bug: Focus Tree Hierarchy — Children Register as Siblings

## The Bug

When a component calls `useFocusNode()` and renders children that also call `useFocusNode()`, all nodes register as flat siblings in the focus tree. This produces invisible focus states, broken keybinding dispatch, and broken visual indicators.

**Example**: `playground/View.tsx` has a horizontal `FocusGroup` with two panes. Pressing `l` should cycle between them. Instead it cycles through four states — two of which are invisible (no green border, no working keybindings).

**Why**: `useFocusNode()` is a hook. Hooks cannot render Providers. So `useFocusNode()` cannot establish `FocusNodeContext` for its children. Every `useFocusNode()` call — whether in a parent component or a deeply nested child — reads the same `FocusNodeContext` from the nearest `FocusGroup` above and registers as a sibling.

This was already identified in `fix-focus-tree-scoping.md`, which established the rule: **`FocusGroup` is the only scoping primitive.** But three gaps remain:

1. **`isFocused` is exact-match only.** A container node cannot tell whether a descendant has focus. Even with correct hierarchy, `focus.focused` on a `FocusGroup` is false when a child inside it is focused.

2. **`FocusGroup` doesn't expose its focused state.** There's no way for a component using `FocusGroup` to read "am I active?" for visual indicators like borders.

3. **Auto-registered keybindings cause key shadowing in nested layouts.** FocusGroup auto-registers navigation keys (j/k or h/l) based on `direction`. When FocusGroups nest, inner groups shadow outer groups' keys. The developer has no control over which level handles which key. This makes nested layouts (file trees, multi-panel dashboards, drill-in UIs) impossible to navigate correctly.

## The Fix

Three changes. No new components.

### Change 1: Rename `useFocus` → `useFocusNode`, add new `useFocus` hook

The current `useFocus()` creates a node in the focus tree — it's used by framework leaf components (Select, TextInput, Viewport) and by `FocusGroup` internally. App developers rarely call it directly. Rename it to `useFocusNode()` to reflect what it does.

The new `useFocus()` reads the focus state of the nearest `FocusGroup` ancestor. It does not create a node in the focus tree — it returns the scope's existing handle. This is the hook app developers will actually use.

- `useFocus()`: "Does my containing scope have focus?" (borders, visual indicators)
- `useFocusNode()`: "I am a focus node" (Select, TextInput, Viewport — framework internals)

The pattern requires a component split: the boundary component renders `FocusGroup` (which establishes `FocusNodeContext`), and a child component calls `useFocus()` to read from it. This follows the same pattern as React Server Components — you need a boundary to establish context, and a child to consume it.

```tsx
// Boundary component — establishes the focus scope
function PRList({ value, onChange }) {
  return (
    <FocusGroup keybindings={{ q: { action: () => process.exit(0), when: 'mounted' } }}>
      <PRListContent value={value} onChange={onChange} />
    </FocusGroup>
  );
}

// Child component — reads focus state from the FocusGroup above
function PRListContent({ value, onChange }) {
  const { focused } = useFocus();
  return (
    <Box borderColor={focused ? 'green' : undefined}>
      <Select options={DUMMY_PRS} value={value} onChange={onChange} immediate />
    </Box>
  );
}
```

`Select` inside `PRListContent` calls `useFocusNode()` internally — it registers under the `FocusGroup`'s node because `FocusGroup` provides `FocusNodeContext`. No changes to Select needed beyond the rename.

#### Implementation

**Rename `src/core/focus/useFocus.ts` → `src/core/focus/useFocusNode.ts`**

Rename the export inside:

```ts
export const useFocusNode = (id?: string): FocusHandle => {
```

**New file: `src/core/focus/useFocus.ts`**

```ts
import { useContext } from 'react';
import { FocusNodeContext, useFocusContext } from './FocusContext';
import type { FocusHandle } from './types';

export const useFocus = (): FocusHandle => {
  const parentId = useContext(FocusNodeContext);
  const { focusNode, isFocused } = useFocusContext();

  if (parentId === null) {
    return { id: '', focused: false, focus: () => {} };
  }

  return {
    id: parentId,
    focused: isFocused(parentId),
    focus: () => focusNode(parentId)
  };
};
```

When called outside any `FocusGroup` (`parentId === null`), returns a no-op handle with `focused: false`. The `id: ''` is a sentinel that doesn't correspond to any real node — calling `focus()` on it is a no-op because `focusNode` guards against unknown node IDs.

**Update `src/core/focus/index.ts`**:

```ts
export { FocusProvider, useFocusContext, FocusNodeContext } from './FocusContext';
export type { FocusContextValue } from './FocusContext';
export { FocusGroup } from './FocusGroup';
export { useFocus } from './useFocus';
export { useFocusNode } from './useFocusNode';
export type { FocusHandle } from './types';
export { useFocusState } from './useFocusState';
export { FocusBindContext } from './FocusBindContext';
```

**Update `src/index.ts`**:

```ts
export { FocusGroup, useFocus, useFocusNode, useFocusState } from './core/focus';
```

#### Rename `useFocus` → `useFocusNode` in all internal consumers

These files import `useFocus` and must be updated to import `useFocusNode`:

| File | Change |
|------|--------|
| `src/core/focus/FocusGroup.tsx` | `import { useFocusNode } from './useFocusNode'` and `const focus = useFocusNode()` |
| `src/core/input/FocusTrap.tsx` | `import { useFocusNode } from '../focus'` and `const { id } = useFocusNode()` |
| `src/ui/Select.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/Autocomplete.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/MultiSelect.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/Confirm.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/TextInput.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/CommandPalette.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/Modal.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |
| `src/ui/Viewport.tsx` | `import { useFocusNode } from '../core/focus'` and `const focus = useFocusNode()` |

#### Rename in documentation examples

| File | Change |
|------|--------|
| `documentation/src/components/examples/focus/use-focus.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/focus/horizontal-tabs.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/focus/controlled-focus.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/focus/navigable-menu.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/input/focus-trap.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/input/file-list.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/router/basic-router.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/ui/modal.tsx` | `useFocus` → `useFocusNode` |
| `documentation/src/components/examples/ui/command-palette.tsx` | `useFocus` → `useFocusNode` |
| `documentation/content/docs/core/focus.mdx` | Update all references |

### Change 2: Make `isFocused` walk ancestors

Change `isFocused(id)` from exact match (`id === focusedId`) to an ancestor walk. Returns true if `id` is the focused node OR any ancestor of the focused node.

This makes `focus.focused` mean "this node or a descendant has focus." For leaf nodes (no children), this is equivalent to exact match — no behavior change. For container nodes (`FocusGroup`), it means "something inside me is focused."

**In `src/core/focus/FocusContext.tsx`**, replace:

```ts
const isFocused = useCallback(
  (id: string) => {
    return id === focusedId;
  },
  [focusedId]
);
```

With:

```ts
const isFocused = useCallback(
  (id: string) => {
    if (!focusedId) return false;
    const nodes = nodesRef.current;
    let cursor: string | null = focusedId;
    while (cursor) {
      if (cursor === id) return true;
      const node = nodes.get(cursor);
      cursor = node?.parentId ?? null;
    }
    return false;
  },
  [focusedId]
);
```

The walk is O(depth) where depth is the focus tree depth (typically 3-5 levels). It only recomputes when `focusedId` changes.

#### Safety analysis

`isFocused` is used in exactly one place: `useFocusNode.ts` (formerly `useFocus.ts`) at the line `focused: isFocused(nodeId)`. This feeds `focus.focused` which is used for visual rendering only. Keybinding dispatch uses `getActiveBranchPath()` in `InputRouter`, which is already an ancestor walk and is unaffected.

**Leaf components** (Select, TextInput, Confirm, Autocomplete, MultiSelect): All check `focus.focused` on their own node. Since leaves have no children in the focus tree, the ancestor walk only matches on exact equality. No behavior change.

**Dashboard's `focus.focused || drilledIn`**: When Row drills in, `FocusTrap` mounts as a sibling of Row (under Column's `FocusGroup`), not as a descendant of Row. The focused Action's ancestor path goes through FocusTrap → Column FocusGroup, never through Row. So `isFocused(Row)` remains false when drilled in. The `|| drilledIn` workaround still works. No behavior change.

**FocusGroup itself**: FocusGroup calls `useFocusNode()` internally. With the ancestor walk, `focus.focused` will be true when any descendant has focus. FocusGroup does not use `focus.focused` for rendering — it only passes `focus` to `useKeybindings`, which does not read `focused`. No behavior change.

### Change 3: Remove auto-keybindings from `FocusGroup`, add navigation helpers

Auto-registered keybindings (j/k, h/l, tab, etc.) cause key shadowing when FocusGroups nest. The framework can't promise conflict-free navigation in arbitrarily nested layouts because it doesn't know which keys ancestors and descendants bind. Remove all auto-binding logic and let the developer choose which keys map to which actions.

FocusGroup becomes a pure scope: registers a node, provides `FocusNodeContext`, and accepts keybindings. No `direction`, no `navigable`, no `wrap` as behavioral props — just a `keybindings` prop that can optionally receive navigation helpers.

#### `keybindings` as a function

The `keybindings` prop accepts either a plain `Keybindings` object (for custom bindings that don't need navigation) or a function that receives navigation helpers:

```tsx
// Plain object — no navigation, just custom bindings
<FocusGroup keybindings={{ q: { action: () => process.exit(0), when: 'mounted' } }}>

// Function — receives helpers for navigation
<FocusGroup keybindings={({ next, prev }) => ({
  l: next,
  h: prev,
})}>
```

##### Helpers

| Helper | Description |
|--------|-------------|
| `next` | Focus the next sibling within this group. Wraps around by default. |
| `prev` | Focus the previous sibling within this group. Wraps around by default. |
| `escape` | Focus this FocusGroup's own node, yielding control to the parent level. |

**How `escape` works**: Focusing the FocusGroup's own node (a non-leaf) means the group's own `next`/`prev` become no-ops — `navigateSibling` walks from `focusedId` up to find a direct child of the group, but `focusedId` IS the group, so no child is found and it returns early. Meanwhile, the parent group's keybindings fire normally because the escaped group's node is a direct child of the parent. The parent can navigate away from it.

```
File tree example:

FocusGroup keybindings={({ next, prev }) => ({ j: next, k: prev })}     (root)
├── FocusGroup keybindings={({ next, prev, escape }) => ({               (src/)
│     j: next, k: prev, h: escape, l: drillIn
│   })}
│   ├── Button.tsx  (leaf)
│   └── Input.tsx   (leaf)
└── README.md       (leaf)

Focus on Button.tsx:
  j/k → navigate between Button.tsx and Input.tsx (src/'s next/prev)
  h   → escape: focusedId = src/ node. Now root's j/k can navigate to README.md
  l   → drill into a subdirectory (focusFirstChild)

Focus on src/ node (after escape):
  j   → root's next: navigate to README.md
  k   → root's prev: wrap to README.md
```

#### Implementation

**In `src/core/focus/FocusGroup.tsx`**:

Remove `direction`, `navigable`, and the `navigationKeys` useMemo entirely. Update `keybindings` to accept the function form.

Updated type:

```ts
type FocusGroupHelpers = {
  next: () => void;
  prev: () => void;
  escape: () => void;
};

type FocusGroupProps = {
  children: React.ReactNode;
  value?: string;
  wrap?: boolean;
  keybindings?: Keybindings | ((helpers: FocusGroupHelpers) => Keybindings);
};
```

`wrap` is retained as a prop — it configures the behavior of the `next`/`prev` helpers. Defaults to `true`.

Updated component:

```tsx
export function FocusGroup({
  children,
  value,
  wrap = true,
  keybindings: customBindings
}: FocusGroupProps) {
  const focus = useFocusNode();
  const { focusNode, navigateSibling } = useFocusContext();
  const bindMapRef = useRef<Map<string, string>>(new Map());

  // register/unregister for value binding (unchanged)
  const register = useCallback((logicalId: string, nodeId: string) => {
    if (bindMapRef.current.has(logicalId)) {
      throw new GigglesError(`FocusGroup: Duplicate id "${logicalId}". Each child must have a unique id.`);
    }
    bindMapRef.current.set(logicalId, nodeId);
  }, []);

  const unregister = useCallback((logicalId: string) => {
    bindMapRef.current.delete(logicalId);
  }, []);

  useEffect(() => {
    if (value) {
      const nodeId = bindMapRef.current.get(value);
      if (nodeId) {
        focusNode(nodeId);
      }
    }
  }, [value, focusNode]);

  const bindContextValue = useMemo(() => (value ? { register, unregister } : null), [value, register, unregister]);

  // Navigation helpers
  const next = useCallback(() => navigateSibling('next', wrap, focus.id), [navigateSibling, wrap, focus.id]);
  const prev = useCallback(() => navigateSibling('prev', wrap, focus.id), [navigateSibling, wrap, focus.id]);
  const escape = useCallback(() => focusNode(focus.id), [focusNode, focus.id]);

  const resolvedBindings = useMemo((): Keybindings => {
    if (typeof customBindings === 'function') {
      return customBindings({ next, prev, escape });
    }
    return customBindings ?? {};
  }, [customBindings, next, prev, escape]);

  useKeybindings(focus, resolvedBindings);

  return (
    <FocusNodeContext.Provider value={focus.id}>
      <FocusBindContext.Provider value={bindContextValue}>{children}</FocusBindContext.Provider>
    </FocusNodeContext.Provider>
  );
}
```

**Export `FocusGroupHelpers` type** from `src/core/focus/index.ts` and `src/index.ts` for developers who want to type their keybindings functions.

#### Migration

All existing usages of `direction` and `navigable` must be updated:

| File | Current | After |
|------|---------|-------|
| `playground/View.tsx` | `<FocusGroup direction="horizontal" navigable>` | `<FocusGroup keybindings={({ next, prev }) => ({ l: next, h: prev })}>` |
| `documentation/src/components/examples/focus/controlled-focus.tsx` | `<FocusGroup value={field} navigable={false} keybindings={{ n: advance }}>` | `<FocusGroup value={field} keybindings={{ n: advance }}>` |
| `documentation/content/docs/core/focus.mdx` | References `direction`, `navigable` props | Remove from prop table, update examples |
| All doc examples using `<FocusGroup direction="vertical">` | Auto j/k navigation | Explicit `keybindings={({ next, prev }) => ({ j: next, k: prev })}` |

## Updated View.tsx

```tsx
import { useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { FocusGroup, GigglesProvider, useFocus } from '../src';
import { Select, Viewport, ViewportRef } from '../src/ui';

function PRListContent({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { focused } = useFocus();

  return (
    <Box flexDirection="column" width={36} borderStyle="round" borderColor={focused ? 'green' : undefined}>
      <Box paddingX={1} paddingBottom={1}>
        <Text bold>Pull Requests</Text>
      </Box>
      <Select options={DUMMY_PRS} value={value} onChange={onChange} immediate />
    </Box>
  );
}

function PRList({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <FocusGroup keybindings={{ q: { action: () => process.exit(0), name: 'Quit', when: 'mounted' } }}>
      <PRListContent value={value} onChange={onChange} />
    </FocusGroup>
  );
}

function PRDetailContent({ pr }: { pr: PR }) {
  const { focused } = useFocus();

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="round"
      paddingX={1}
      borderColor={focused ? 'green' : undefined}
    >
      <Box flexDirection="column" paddingBottom={1}>
        <Text bold>{pr.label}</Text>
        <Text dimColor>
          {pr.author} · {pr.branch}
        </Text>
      </Box>
      <Viewport height={20} keybindings={false}>
        <Text>{pr.body}</Text>
      </Viewport>
    </Box>
  );
}

function PRDetail({ pr }: { pr: PR }) {
  const viewportRef = useRef<ViewportRef>(null);

  return (
    <FocusGroup keybindings={{
      down: () => viewportRef.current?.scrollBy(1),
      up: () => viewportRef.current?.scrollBy(-1),
      j: () => viewportRef.current?.scrollBy(1),
      k: () => viewportRef.current?.scrollBy(-1),
      g: () => viewportRef.current?.scrollToTop(),
      G: () => viewportRef.current?.scrollToBottom()
    }}>
      <PRDetailContent pr={pr} />
    </FocusGroup>
  );
}

export default function View() {
  const [selectedPR, setSelectedPR] = useState(DUMMY_PRS[0].value);
  const pr = DUMMY_PRS.find((p) => p.value === selectedPR) ?? DUMMY_PRS[0];

  return (
    <FocusGroup keybindings={({ next, prev }) => ({
      l: next,
      h: prev,
    })}>
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <PRList value={selectedPR} onChange={setSelectedPR} />
        <PRDetail pr={pr} />
      </Box>
    </FocusGroup>
  );
}
```

Note: `viewportRef` lives in `PRDetail` (the component rendering `FocusGroup`), not in `PRDetailContent`. The scroll keybindings are passed to `FocusGroup` via its `keybindings` prop. `Viewport` is rendered with `keybindings={false}` since scroll control is handled by the `FocusGroup` scope. `PRDetailContent` does not need the ref — it only reads `useFocus()` for the border.

Note: the `DUMMY_PRS` data and `type PR` definition from the existing View.tsx are unchanged and should be kept as-is.

## Resulting focus tree

```
G (outer FocusGroup)
├── PL (PRList's FocusGroup)
│   └── S (Select's useFocusNode, leaf)
└── PD (PRDetail's FocusGroup)
    └── V (Viewport's useFocusNode, leaf)
```

### Why the tree forms correctly despite effect ordering

React fires effects bottom-up (children before parents). So `S` registers before `PL`, and `PL` registers before `G`. When `S` registers with `parentId=PL`, `PL` doesn't exist yet — the parent lookup fails and `PL.childrenIds` is not updated.

This is handled by `registerNode`'s reverse-scan (lines 82-86 of `FocusContext.tsx`). When `PL` later registers, it scans all existing nodes and adopts any whose `parentId` matches `PL`. This picks up `S`, so `PL.childrenIds = [S]`. Same for `PD` adopting `V`, and `G` adopting `PL` and `PD`.

The first node to register (`S`, since it's the deepest child) triggers auto-focus via the `nodes.size === 1` guard. So `focusedId = S` on load.

## Navigation flow

1. **Load**: `focusedId = S`. `isFocused(PL)` = true (ancestor walk: S.parentId=PL → match). `useFocus()` in PRListContent returns `{ focused: true }`. Green border on PRList. j/k fires on Select's bindings (S is in active path [S, PL, G]).

2. **Press l**: InputRouter walks active path [S, PL, G]. No `l` binding on S (Select registers j/k/down/up/enter). No `l` binding on PL (PRList's FocusGroup registers only `q` with `when: 'mounted'`, skipped during path walk). `l` found on G (outer FocusGroup's explicit keybinding). `next()` calls `navigateSibling('next', true, G)`: walks from `focusedId=S` up to find which direct child of G contains focus — S.parentId=PL, PL.parentId=G, so `currentChildId=PL`. Current index 0, next index 1 → PD. PD has children `[V]`, so `focusFirstChild(PD)` recursively drills to V (a leaf). `focusedId = V`. `isFocused(PD)` = true (ancestor walk: V.parentId=PD → match). Green border on PRDetail. j/k: InputRouter walks [V, PD, G]. No j/k on V (Viewport's `keybindings={false}` registers empty bindings). j/k found on PD (PRDetail's FocusGroup registers scroll keybindings). `viewportRef.current?.scrollBy(1)` fires.

3. **Press l again**: InputRouter walks [V, PD, G]. No `l` on V or PD. `l` on G. `next()` → `navigateSibling('next', true, G)`: walks from V up — V.parentId=PD, PD.parentId=G, so `currentChildId=PD`. Current index 1, next index 0 (wraps) → PL. `focusFirstChild(PL)` → S. `focusedId = S`. Back to PRList with green border and working j/k.

Two states. Both with green borders. Both with working keybindings.

## Edge cases

**`FocusGroup` with no children that call `useFocusNode()`**: The `FocusGroup` node is a leaf. `focusFirstChild` drills into it, finds no children, and calls `focusNode` on the `FocusGroup` node directly. The node is focused and keybindings registered on it fire normally.

**`useFocus()` called outside any `FocusGroup`**: `parentId` is null. Returns `{ id: '', focused: false, focus: () => {} }`. The `id: ''` is a sentinel — `focusNode('')` is a no-op because the node doesn't exist in the tree.

**Nested `FocusGroup` components**: Each `FocusGroup` creates a new scope. Children register under the innermost `FocusGroup`. This is the intended behavior — each `FocusGroup` is a self-contained focus unit.

**`escape` on a nested group**: Focuses the group's own node. The group's `next`/`prev` become no-ops (can't find a direct child containing focus when the group itself is focused). The parent group's keybindings take over — its `next`/`prev` can navigate away from the escaped group. Pressing a key that drills back in (like `l` or `Enter`) can call `focusFirstChild` on the group to re-enter it.

## Summary of all changes

| File | Change |
|------|--------|
| `src/core/focus/useFocusNode.ts` | **Renamed from `useFocus.ts`.** Export renamed to `useFocusNode`. No logic changes. |
| `src/core/focus/useFocus.ts` | **New file.** Hook that reads focus state from nearest `FocusGroup` ancestor without creating a node. Returns `FocusHandle`. |
| `src/core/focus/FocusContext.tsx` | Change `isFocused` from exact match to ancestor walk. |
| `src/core/focus/FocusGroup.tsx` | Import `useFocusNode` instead of `useFocus`. Remove `direction`, `navigable` props and all auto-navigation logic. `keybindings` prop accepts `Keybindings | ((helpers) => Keybindings)`. Expose `next`, `prev`, `escape` helpers. Export `FocusGroupHelpers` type. |
| `src/core/focus/index.ts` | Export both `useFocus` (new) and `useFocusNode` (renamed). Export `FocusGroupHelpers` type. |
| `src/index.ts` | Export `useFocus`, `useFocusNode`, and `FocusGroupHelpers` in public API. |
| `src/core/input/FocusTrap.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/Select.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/Autocomplete.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/MultiSelect.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/Confirm.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/TextInput.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/CommandPalette.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/Modal.tsx` | `useFocus` → `useFocusNode`. |
| `src/ui/Viewport.tsx` | `useFocus` → `useFocusNode`. |
| `playground/View.tsx` | Rewrite using `FocusGroup` + `useFocus()` pattern. Explicit keybindings via helpers. |
| `documentation/src/components/examples/focus/*.tsx` | `useFocus` → `useFocusNode`. Update FocusGroup usage to remove `direction`/`navigable`, add explicit keybindings. |
| `documentation/src/components/examples/input/*.tsx` | `useFocus` → `useFocusNode`. |
| `documentation/src/components/examples/router/*.tsx` | `useFocus` → `useFocusNode`. |
| `documentation/src/components/examples/ui/*.tsx` | `useFocus` → `useFocusNode`. |
| `documentation/content/docs/core/focus.mdx` | Update all references. Remove `direction`, `navigable` from prop table. Document `keybindings` function form and helpers. |

No logic changes to Select, Viewport, TextInput, FocusTrap, or InputRouter beyond the `useFocus` → `useFocusNode` rename.
