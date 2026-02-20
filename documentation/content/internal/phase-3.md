# Components & Discoverability

UI components and command palette built on the core framework.

## Progress

| Feature         | Render Prop | Status      |
| --------------- | ----------- | ----------- |
| Command Palette | Yes         | Done        |
| TextInput       | Yes         | Done        |
| Select          | Yes         | Done        |
| MultiSelect     | Yes         | Done        |
| Confirm         | No          | Not Started |
| Autocomplete    | Yes         | Not Started |
| Split           | No          | Not Started |
| Tabs            | No          | Not Started |
| Table           | Yes         | Not Started |
| VirtualList     | Yes         | Not Started |
| Spinner         | No          | Not Started |
| Badge           | No          | Not Started |
| Markdown        | No          | Not Started |
| Modal           | No          | Not Started |
| Dialog          | No          | Not Started |
| Toast           | No          | Not Started |
| StatusBar       | No          | Not Started |
| Breadcrumb      | No          | Not Started |
| KeyHints        | No          | Not Started |

---

## Framework Changes (from Phase 3 work)

Building TextInput required several additions to the core input system. These are now available for all components.

### passthrough (KeybindingOptions)

Capture mode (`capture: true`) intercepts all input — nothing bubbles to parent nodes. The `passthrough` option lists key names that should skip capture and continue bubbling.

```tsx
useKeybindings(
  focus,
  { backspace: handleBackspace },
  {
    capture: true,
    passthrough: ['tab', 'shift+tab', 'escape'],
    onKeypress: (input, key) => { /* handle printable chars */ }
  }
);
```

**Dispatch order in InputRouter:**
1. Named bindings checked first — if a key matches, the handler fires and input stops
2. If no named binding matches and the node has `capture + onKeypress`:
   - If the key is in `passthrough` → skip this node, continue bubbling
   - Otherwise → fire `onKeypress`, input stops
3. If the node is a trap boundary → input stops
4. Continue to next node in the focus path
5. Fall through to `when: 'mounted'` bindings

Named bindings always take priority over passthrough. A component can put `'enter'` in its passthrough list but conditionally add an `enter` named binding — the binding fires when present, otherwise Enter bubbles.

### normalizeKey changes

- `'shift+tab'` — detected via `key.tab && key.shift`
- `'delete'` (forward-delete) — detected via the raw escape sequence `\x1b[3~`, NOT via `key.delete`. On macOS, the physical backspace key sends `\x7f` which Ink maps to `key.delete = true`, so `key.delete` cannot be used to distinguish forward-delete from backspace. Both `key.backspace` and `key.delete` (except `\x1b[3~`) normalize to `'backspace'`.

### FocusGroup tab navigation

FocusGroup now binds `tab` → next and `shift+tab` → prev alongside its directional keys (j/k or h/l). This works with capture-mode children because they declare tab/shift+tab as passthrough keys.

---

## Command Palette

### Concept

A fuzzy-searchable list of all available actions in the app, accessible via a global keybinding (e.g., `Ctrl+K`). Components register their actions into a central registry. The palette collects and displays them.

```
┌──────────────────────────────┐
│ > rename                     │
├──────────────────────────────┤
│   Rename file            r   │
│   Rename branch        F2    │
└──────────────────────────────┘
```

### Registering Commands

Commands are registered through `useKeybindings` by providing a `name` field. Commands are scoped — they're removed when the component unmounts.

```tsx
function FileList() {
  const focus = useFocus();

  useKeybindings(focus, {
    d: { action: deleteSelected, name: 'Delete file' },
    r: { action: renameSelected, name: 'Rename file' },
    'ctrl+c': { action: copyPath, name: 'Copy path' },
    j: () => moveDown(), // no name = won't appear in palette
    k: () => moveUp()
  });
}
```

### Context Awareness

Commands can be scoped to when the registering component is focused or merely mounted:

```tsx
useKeybindings(
  focus,
  {
    d: { action: deleteSelected, name: 'Delete file' },
    'ctrl+f': { action: openSearch, name: 'Search files' }
  },
  {
    when: 'focused' // or 'mounted'
  }
);
```

- `when: 'focused'` — only appears in palette when the registering component is the focused leaf
- `when: 'mounted'` — appears whenever the registering component is mounted (any screen containing it)

### Reading the Registry

The command palette (or any custom UI) can read registered keybindings in different scopes:

```tsx
function CustomCommandPalette() {
  const registry = useKeybindingRegistry();

  // registry.all - All registered keybindings across the entire app
  // registry.available - Only keybindings currently reachable via focus path
  // registry.local - Only keybindings registered by the calling component

  return (
    <List>
      {registry.all.map((cmd) => (
        <ListItem key={cmd.key} onClick={cmd.action}>
          {cmd.name} <Text dimColor>{cmd.key}</Text>
        </ListItem>
      ))}
    </List>
  );
}
```

### Palette Component

The palette itself is a framework-provided component. It's a `FocusTrap` with capture mode — takes over all input while open, dismisses on `Escape`.

Internally, it uses `useKeybindingRegistry()` to read all registered keybindings, fuzzy-matches the search query against command names, and executes the selected command.

```tsx
function App() {
  const focus = useFocus();
  const [showPalette, setShowPalette] = useState(false);

  useKeybindings(focus, {
    'ctrl+k': () => setShowPalette(true)
  });

  return (
    <>
      <MainContent />
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
    </>
  );
}
```

---

## TextInput

### Implementation

`src/ui/TextInput.tsx` — controlled single-line text input.

**Props:** `value`, `onChange`, `onSubmit?`, `label?`, `placeholder?`, `render?`

**Internal design:**
- Controlled: `value` + `onChange` from parent, cursor is internal
- Cursor uses `useRef` (not `useState`) to avoid Ink rendering flicker from un-batched state updates. Navigation keys (left/right/home/end) trigger re-render via `useReducer` counter. Editing keys (char insert, backspace, delete) update the ref before calling `onChange`, which triggers the parent re-render — cursor is already correct when TextInput re-renders.
- Uses `capture: true` with `passthrough: ['tab', 'shift+tab', 'enter', 'escape']`
- `onSubmit`: when provided, `enter` is spread into the named bindings object. Named bindings fire before the passthrough check, so Enter calls `onSubmit` instead of bubbling. When `onSubmit` is absent, Enter passes through to parent bindings.

**Render prop:** passes `{ value, focused, before, cursorChar, after }` — pre-split segments, not a raw cursor number. This is intentional: passing a raw cursor invites users to do their own slicing inside `<Box>` layouts, which causes Ink/Yoga remeasurement flicker. Pre-split segments make flat `<Text>` rendering the natural pattern.

**Ink rendering constraint:** Do NOT use `<Box>` (especially with `gap`) for inline text that changes width between renders. Yoga recalculates layout on content width changes, causing visible flicker. Use flat `<Text>` with inline children instead. This applies to all components, not just TextInput.

### Example

```tsx
import { TextInput } from 'giggles/ui';

function SimpleInput() {
  const [value, setValue] = useState('');

  return <TextInput label="Name:" value={value} onChange={setValue} placeholder="John Doe" />;
}
```

Custom rendering via render prop:

```tsx
<TextInput
  label="Notes:"
  value={value}
  onChange={setValue}
  render={({ before, cursorChar, after, focused }) => (
    <Text color={focused ? 'cyan' : 'white'}>
      {before}
      <Text inverse>{cursorChar}</Text>
      {after}
    </Text>
  )}
/>
```

---

## Built-in UI Components

### Design Approach

Every component ships as a single styled component from `giggles/ui` with sensible defaults and good props. No separate primitives package.

For components where rendering genuinely varies (inputs with cursors, lists with custom items, tables with custom cells), a `render` prop gives full control over the visual output without needing a separate abstraction layer. The terminal's styling surface area (border styles, colors, bold/dim/inverse, padding) is small enough that props cover the vast majority of customization needs.

### Customization Strategy

Components are customizable through three levels, in order of reach:

1. **Props** — Colors, labels, border styles, placeholder text. Covers most use cases.
2. **Render prop** — Full control over how a component renders its content. Available on components marked with "Render Prop: Yes" in the progress table. Use this when the default rendering doesn't fit.
3. **Build your own** — Use the framework's focus management, keybinding, and input hooks directly. This is always an option and doesn't require a primitives layer.

### Standard Callbacks

Interactive components use these callback names consistently:

- `onChange(value)` — value changed (controlled component pattern)
- `onSubmit(value)` — user confirmed/committed (optional; conditionally spread into keybindings)
- `onHighlight(value)` — highlight/cursor moved to a new item (for preview panes, status updates)

### Standard Props for List-like Components

List-based components (Select, MultiSelect, Autocomplete, Table) share a common prop surface:

- `options: SelectOption<T>[]` — items to choose from
- `value` / `onChange` — controlled state (`T` for single-select, `T[]` for multi-select)
- `onHighlight?: (value: T) => void` — highlight moved
- `label?: string` — optional label, only used in default rendering
- `direction?: 'vertical' | 'horizontal'` — navigation axis (default `'vertical'`)
- `immediate?: boolean` — fire `onChange` on navigation instead of requiring `enter` to confirm
- `render?` — full visual control per item

Navigation keys follow direction: vertical = `j`/`k`/`up`/`down`, horizontal = `h`/`l`/`left`/`right`. `enter` confirms in both directions. List components are single focusable nodes that manage their own highlight index internally (not FocusGroups).

### Patterns for Capture-Mode Components

Components that handle arbitrary text input (TextInput, Autocomplete, etc.) need `capture: true` on `useKeybindings` to intercept printable characters via `onKeypress`. Key patterns established by TextInput:

- **Navigation keys as named bindings** — `left`, `right`, `home`, `end`, `backspace`, `delete`. Named bindings fire before `onKeypress`, so they won't be caught by the printable char handler.
- **Printable chars in onKeypress** — guard with `input.length === 1 && !key.ctrl && !key.return && !key.escape && !key.tab`.
- **passthrough for focus navigation** — `['tab', 'shift+tab']` at minimum. Add `'enter'` and `'escape'` if the component doesn't need to consume them.
- **Conditional named bindings** — use spread to add bindings based on props: `...(onSubmit && { enter: () => onSubmit(value) })`. Named bindings take priority over passthrough, so the same key can be in both.
- **Cursor as ref** — Ink's renderer may not batch cross-component state updates. Use `useRef` for cursor position and `useReducer` for forcing re-renders on navigation-only changes.

### Patterns for List-like Components

Established by Select/MultiSelect. Apply to any component that navigates a list of items.

- **Highlight index clamping** — Options can change between renders. Clamp the highlight index at the top of the component body, before any handlers read it. Pattern: `const safeIndex = options.length === 0 ? -1 : Math.min(highlightIndex, options.length - 1)`. Same principle as TextInput's cursor clamping.
- **Empty options guard** — All handlers that access `options[index]` must early-return when `options.length === 0`.
- **Duplicate value validation** — Throw `GigglesError` if any two options share the same `String(value)`. This also catches React key collisions.
- **React keys** — Use `String(option.value)` as the key, not array index. Option values must be unique (enforced above), so this is safe and survives reordering.
- **No side effects in state updaters** — Do not call `onChange`/`onHighlight` inside `setHighlightIndex(prev => ...)`. Compute the new index, call `setHighlightIndex(next)`, then call callbacks as separate statements. React may call updater functions twice in Strict Mode.
- **`useKeybindings` re-registers on every render** — The bindings object is passed to `registerKeybindings` during render (not in a `useEffect`), so handlers always have fresh closures. No refs needed for keybinding handlers.
- **Space key** — `normalizeKey` does not handle space specially. Bind it as `' '` (literal space string), not `'space'`.
- **No capture mode** — List components don't handle printable text input, so they don't need `capture: true`. Tab/shift+tab bubble naturally without passthrough.
- **Single focusable node** — List components manage their own highlight index with `useState`. They do NOT use FocusGroup (which would register each option as a separate focus node in the tree).

### Planned Components

- **Input**: `Select`, `MultiSelect`, `Confirm`, `Autocomplete`
- **Layout**: `Split`, `Tabs`
- **Display**: `Table`, `VirtualList`, `Spinner`, `Badge`, `Markdown`
- **Overlay**: `Modal`, `Dialog`, `Toast`
- **Chrome**: `StatusBar`, `Breadcrumb`, `KeyHints`

Each component handles responsive behavior internally (adapts to available space, scrolls when necessary, truncates intelligently). Developers describe layout with flexbox; components measure and adapt.

### File Structure

Components live in `src/ui/`. Each component is a single file exporting the component and its render prop types. The barrel export is `src/ui/index.ts`. Public types go in the barrel export; internal types (props, reducer actions) stay in the component file.

Documentation lives in `documentation/content/docs/ui/` with one `.mdx` file per component plus an `index.mdx` overview. Live playground examples go in `documentation/src/components/examples/ui/`. Playground scripts live in `playground/` at the project root.
