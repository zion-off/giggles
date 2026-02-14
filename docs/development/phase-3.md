# Components & Discoverability

UI components and command palette built on the core framework.

## Progress

| Feature                           | Status      |
| --------------------------------- | ----------- |
| Command Palette                   | Not Started |
| TextInput (primitive + styled)    | Not Started |
| Select (primitive + styled)       | Not Started |
| MultiSelect (primitive + styled)  | Not Started |
| Confirm (primitive + styled)      | Not Started |
| Autocomplete (primitive + styled) | Not Started |
| Split (primitive + styled)        | Not Started |
| Tabs (primitive + styled)         | Not Started |
| Table (primitive + styled)        | Not Started |
| VirtualList (primitive + styled)  | Not Started |
| Spinner (primitive + styled)      | Not Started |
| Badge (primitive + styled)        | Not Started |
| Markdown (primitive + styled)     | Not Started |
| Modal (primitive + styled)        | Not Started |
| Dialog (primitive + styled)       | Not Started |
| Toast (primitive + styled)        | Not Started |
| StatusBar (primitive + styled)    | Not Started |
| Breadcrumb (primitive + styled)   | Not Started |
| KeyHints (primitive + styled)     | Not Started |

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

## Built-in UI Primitives

### Two-Tier Architecture

The framework provides UI components in two forms:

1. **Unstyled primitives** — Pure behavior and logic (focus management, keyboard handling, state machines) with no visual opinions
2. **Styled components** — Thin wrappers around primitives with sensible default styling

This is inspired by Radix UI and Headless UI from the web ecosystem. Most users can use the styled components and get a polished experience out of the box. Power users can drop down to unstyled primitives for full control.

### Example: TextInput

Unstyled primitive (full control):

```tsx
import { TextInput } from 'giggles/primitives';

function CustomInput() {
  const [value, setValue] = useState('');

  return (
    <TextInput.Root>
      <TextInput.Label>Enter your name:</TextInput.Label>
      <TextInput.Input
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
    </TextInput.Root>
  );
}
```

Styled component (batteries included):

```tsx
import { TextInput } from 'giggles/ui';

function SimpleInput() {
  const [value, setValue] = useState('');

  return <TextInput label="Enter your name:" value={value} onChange={setValue} placeholder="John Doe" />;
}
```

The styled component internally uses the primitive. It's just a convenience wrapper with default styling decisions.

### Why This Matters

- **Progressive disclosure** — Start simple, drop down when you need customization
- **Maintainability** — Behavior lives in one place (primitives), styling is just a wrapper
- **No fighting defaults** — When the styled component doesn't fit, use primitives instead of overriding styles
- **Testability** — Unstyled primitives are easier to unit test (pure logic, no rendering)
- **Consistency** — All styled components share the same visual language, but you can customize individual pieces

### Implementation Note

Primitive components expose their behavior through:

- Compound components (`Root`, `Input`, `Label`, etc.)
- Render props for full rendering control
- State and event handlers
- Focus management integration with the framework's focus tree

Styled components are just React components that compose primitives with default `render` implementations.

### Planned Components

All components below will ship in both primitive and styled forms:

- **Input**: `TextInput`, `Select`, `MultiSelect`, `Confirm`, `Autocomplete`
- **Layout**: `Split`, `Tabs`
- **Display**: `Table`, `VirtualList`, `Spinner`, `Badge`, `Markdown`
- **Overlay**: `Modal`, `Dialog`, `Toast`
- **Chrome**: `StatusBar`, `Breadcrumb`, `KeyHints`

Each component handles responsive behavior internally (adapts to available space, scrolls when necessary, truncates intelligently). Developers describe layout with flexbox; components measure and adapt.
