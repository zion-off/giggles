# Components & Discoverability

UI components and command palette built on the core framework.

## Progress

| Feature       | Render Prop | Status      |
| ------------- | ----------- | ----------- |
| Command Palette | Yes       | Done        |
| TextInput     | Yes         | Not Started |
| Select        | Yes         | Not Started |
| MultiSelect   | Yes         | Not Started |
| Confirm       | No          | Not Started |
| Autocomplete  | Yes         | Not Started |
| Split         | No          | Not Started |
| Tabs          | No          | Not Started |
| Table         | Yes         | Not Started |
| VirtualList   | Yes         | Not Started |
| Spinner       | No          | Not Started |
| Badge         | No          | Not Started |
| Markdown      | No          | Not Started |
| Modal         | No          | Not Started |
| Dialog        | No          | Not Started |
| Toast         | No          | Not Started |
| StatusBar     | No          | Not Started |
| Breadcrumb    | No          | Not Started |
| KeyHints      | No          | Not Started |

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
  useKeybindings({
    d: { action: deleteSelected, name: 'Delete file' },
    r: { action: renameSelected, name: 'Rename file' },
    'ctrl+c': { action: copyPath, name: 'Copy path' },
    j: () => moveDown(), // no name = won't appear in palette
    k: () => moveUp() // no name = won't appear in palette
  });
}
```

This single declaration:

1. Binds the key so it works when focused
2. Registers it in the command palette (if `name` is provided)
3. Removes it from the palette when the component unmounts

### Context Awareness

Commands can be scoped to when the registering component is focused or merely mounted:

```tsx
useKeybindings(
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
  // Useful for: Full command palette, settings screens
  registry.all; // [
  //   { key: 'd', name: 'Delete file', action: fn, when: 'focused' },
  //   { key: 'r', name: 'Rename file', action: fn, when: 'focused' },
  //   { key: 'ctrl+q', name: 'Quit', action: fn, when: 'mounted' },
  //   ...
  // ]

  // registry.available - Only keybindings currently active based on focus tree
  // Includes: focused component + all parent components (bubble path)
  // Useful for: Context-aware help ("what can I do right now?")
  registry.available; // [
  //   { key: 'd', name: 'Delete file', action: fn }, // from focused FileList
  //   { key: 'ctrl+q', name: 'Quit', action: fn },   // from parent App
  // ]

  // registry.local - Only keybindings registered by the calling component
  // Useful for: Debugging, component introspection
  registry.local; // [
  //   { key: 'ctrl+k', name: 'Open command palette', action: fn }
  // ]

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

**Example: Context-Aware Help Screen**

```tsx
function HelpScreen() {
  const registry = useKeybindingRegistry();

  return (
    <Box flexDirection="column">
      <Text bold>Available Commands:</Text>
      {registry.available.map((cmd) => (
        <Text key={cmd.key}>
          <Text color="cyan">{cmd.key.padEnd(10)}</Text>
          {cmd.name}
        </Text>
      ))}
    </Box>
  );
}
```

### Palette Component

The palette itself is a framework-provided component. It's a `FocusTrap` with capture mode — takes over all input while open, dismisses on `Escape`.

Internally, it uses `useKeybindingRegistry()` to read all registered keybindings, fuzzy-matches the search query against command names, and executes the selected command.

```tsx
// Usage - just render it when needed
function App() {
  const [showPalette, setShowPalette] = useState(false);

  useKeybindings({
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

## Built-in UI Components

### Design Approach

Every component ships as a single styled component from `giggles/ui` with sensible defaults and good props. No separate primitives package.

For components where rendering genuinely varies (inputs with cursors, lists with custom items, tables with custom cells), a `render` prop gives full control over the visual output without needing a separate abstraction layer. The terminal's styling surface area (border styles, colors, bold/dim/inverse, padding) is small enough that props cover the vast majority of customization needs.

### Customization Strategy

Components are customizable through three levels, in order of reach:

1. **Props** — Colors, labels, border styles, placeholder text. Covers most use cases.
2. **Render prop** — Full control over how a component renders its content. Available on components marked with "Render Prop: Yes" in the progress table. Use this when the default rendering doesn't fit.
3. **Build your own** — Use the framework's focus management, keybinding, and input hooks directly. This is always an option and doesn't require a primitives layer.

### Example: TextInput

Default usage:

```tsx
import { TextInput } from 'giggles/ui';

function SimpleInput() {
  const [value, setValue] = useState('');

  return <TextInput label="Enter your name:" value={value} onChange={setValue} placeholder="John Doe" />;
}
```

Custom rendering via render prop:

```tsx
import { TextInput } from 'giggles/ui';

function CustomInput() {
  const [value, setValue] = useState('');

  return (
    <TextInput
      label="Enter your name:"
      value={value}
      onChange={setValue}
      render={({ value, focused, cursor }) => (
        <Box borderStyle="double" borderColor={focused ? 'cyan' : 'gray'}>
          <Text color={focused ? 'cyan' : 'white'}>
            {value.slice(0, cursor)}
            <Text inverse>{value[cursor] || ' '}</Text>
            {value.slice(cursor + 1)}
          </Text>
        </Box>
      )}
    />
  );
}
```

Same component, same import. The `render` prop opts into full control when you need it.

### Planned Components

- **Input**: `TextInput`, `Select`, `MultiSelect`, `Confirm`, `Autocomplete`
- **Layout**: `Split`, `Tabs`
- **Display**: `Table`, `VirtualList`, `Spinner`, `Badge`, `Markdown`
- **Overlay**: `Modal`, `Dialog`, `Toast`
- **Chrome**: `StatusBar`, `Breadcrumb`, `KeyHints`

Each component handles responsive behavior internally (adapts to available space, scrolls when necessary, truncates intelligently). Developers describe layout with flexbox; components measure and adapt.
