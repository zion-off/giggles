# Fix: Focus Tree Scoping Bug

## The Bug

Keybindings registered on a parent component via `useFocus()` + `useKeybindings()` never fired when a child inside a `FocusGroup` was focused.

```tsx
// BROKEN: pressing 'n' does nothing
function Form() {
  const focus = useFocus();
  useKeybindings(focus, { n: () => setField(...) });

  return (
    <FocusGroup value={field}>
      <Field id="name" />
      <Field id="email" />
    </FocusGroup>
  );
}
```

## Root Cause

Two separate issues combined to create the bug.

### 1. Orphan nodes in the focus tree

`useFocus()` is a hook — it registers a focus node but cannot render a `FocusNodeContext.Provider`. Only `FocusGroup` provides `FocusNodeContext` for its children. This meant Form's node and FocusGroup's node were **siblings at the root**, not parent-child:

```
root
├── Form (:r1:)          ← parentId: null
└── FocusGroup (:r3:)    ← parentId: null (should be :r1:!)
    ├── Field "name"
    └── Field "email"
```

When `getActiveBranchPath()` walked from the focused field upward, it hit FocusGroup → null. Form's node was never in the path, so its keybindings were never checked.

### 2. Stale active branch path

React fires effects bottom-up (children before parents). When Field "name" registered as the first node, `focusNode()` computed the active branch path — but FocusGroup and Form hadn't registered yet. The path was just `[":r5:"]`.

Later, when FocusGroup's effect called `focusNode(":r5:")` again, the `if (current === id) return current` guard skipped recalculation. The path remained stale for the entire session.

## Fix

### Design decision: `FocusGroup` is the scoping primitive

Since React hooks cannot render Providers, a hook alone can never establish tree scope. Rather than introducing a new `FocusScope` component, we made `FocusGroup` the single answer to "I need a focus scope." It already calls `useFocus`, provides `FocusNodeContext`, and calls `useKeybindings`. Adding a `keybindings` prop lets users register custom bindings directly:

```tsx
// FIXED: keybindings live on FocusGroup, which IS in the active branch
function Form() {
  const [field, setField] = useState('name');

  return (
    <FocusGroup value={field} keybindings={{ n: () => setField(...) }}>
      <Field id="name" />
      <Field id="email" />
    </FocusGroup>
  );
}
```

### Lazy path computation

Changed `getActiveBranchPath()` from reading cached state to computing from `nodesRef.current` at call time. This eliminates the stale path problem entirely — when InputRouter calls `getActiveBranchPath()`, it always reflects the current tree structure.

### Dead state removal

Removed `activeBranchNodes`, `activeBranchPath`, and `isInActiveBranch` from FocusProvider. These were eagerly-computed cached values that were always at risk of staleness. The lazy `getActiveBranchPath()` replaced all of them.

## Changes

- `src/core/focus/FocusGroup.tsx` — added `keybindings` prop, merged with navigation keys
- `src/core/focus/FocusContext.tsx` — lazy `getActiveBranchPath`, removed stale state and `isInActiveBranch`
