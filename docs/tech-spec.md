# Ink Framework — Technical Specification

## Overview

A framework built on top of [Ink](https://github.com/vadimdemedes/ink) (React for the terminal) that solves the core problems of building complex TUI applications. Ink provides the rendering layer (React components to terminal output via Yoga/flexbox), but lacks the structural primitives needed for non-trivial apps. This framework fills that gap.

## Problems This Framework Solves

1. **Input leaking** — Ink's `useInput` is a global listener. Any component can hear any keypress. When one component is capturing input (e.g., a text field), keypresses leak to other components.
2. **Manual focus management** — No built-in system for managing focus between multiple focusable elements. Developers track focus with boolean state and pass it around manually.
3. **No composition standard** — No conventions for structuring multi-screen apps, managing navigation, or composing complex layouts.
4. **No terminal lifecycle hooks** — Missing essentials like terminal focus detection, alternate screen management, and external process handoff.
5. **Components not responsive** — No built-in primitives that adapt to available terminal space.

## Design Philosophy

- **Ink is the rendering layer, this framework is the structural layer.** We don't replace Ink. We build on top of it.
- **Input is routed, not broadcast.** Keypresses go to one place, explicitly. Inspired by the Elm architecture (Bubbletea), but implemented with React idioms (hooks + context).
- **Components are responsible for their own space.** Responsiveness is not a framework pillar — it's a requirement for every built-in primitive. Components measure their available space and adapt internally. The developer describes layout with flexbox; components handle the rest.
- **Don't over-abstract.** Ship utilities, not opinions. `useTerminalSize()` is a hook, not a breakpoint system. The framework provides tools; the developer decides when to use them.
- **React-idiomatic.** Hooks, context, JSX. No new programming models. A React developer should feel at home immediately.

## Prior Art

- **Bubbletea (Go)** — Elm architecture for TUIs. Single `Update` function receives all input as messages, routes explicitly. Prevents input leaking by design. Our input system borrows this constraint but implements it with React patterns.
- **React Navigation (React Native)** — Stack-based screen navigation with automatic focus management. Our screen router is modeled directly on this.
- **SwiftUI `@FocusState`** — Declarative focus binding to an enum. Inspired our `useFocusState()` hook.
- **Vim/Tmux** — Modal input (insert mode vs normal mode). Inspired our capture mode for text inputs.

---

## Architecture

### 1. Input System

#### The Problem

Ink's `useInput` is a global event listener. Every component that calls `useInput` receives every keypress. This means:

```tsx
// BROKEN: Both components hear 'j' at the same time
function Sidebar() {
  useInput((input) => {
    if (input === 'j') moveSidebarDown(); // fires!
  });
}
function MainPanel() {
  useInput((input) => {
    if (input === 'j') moveMainDown(); // also fires!
  });
}
```

#### The Solution

A single root-level `useInput` listener owned by the framework. It checks the focus tree, finds the focused component, and dispatches the keypress only to that component's keybinding handler. Other components never see it.

#### API: `useKeybindings`

```tsx
function FileList() {
  const { focused } = useFocus();

  // These ONLY fire when FileList is focused.
  useKeybindings({
    j: () => moveDown(),
    k: () => moveUp(),
    enter: () => openFile()
  });

  return <List focused={focused} items={files} />;
}
```

#### Bubbling

Unhandled keys bubble up the focus tree, like DOM events. If the focused component doesn't handle `ctrl+q`, it bubbles to the parent, then the grandparent, up to the root.

```
User presses 'ctrl+q'
  → FileList has no binding for ctrl+q
  → Bubbles to MainPanel — no binding
  → Bubbles to App — has 'ctrl+q' → exits
```

`FocusTrap` stops bubbling entirely. Used for modals and dialogs:

```tsx
function App() {
  const [showModal, setShowModal] = useState(false);

  useKeybindings(
    {
      '?': () => setShowModal(true),
      q: () => exit()
    },
    { layer: 'global' }
  );

  return (
    <Screen>
      <MainContent />
      {showModal && (
        <FocusTrap>
          <HelpModal onClose={() => setShowModal(false)} />
        </FocusTrap>
      )}
    </Screen>
  );
}
```

#### Capture Mode

For components like text inputs that need to receive ALL keystrokes (letters, numbers, punctuation) instead of having them interpreted as keybindings.

When `capture: true` is set on the focused node:

- Explicit keybindings (like `escape`, `enter`) are checked first
- Everything else goes to `onKeypress` — never bubbles

```tsx
function TextInput({ onSubmit }) {
  const [value, setValue] = useState('');

  useKeybindings(
    {
      escape: () => blur(),
      enter: () => onSubmit(value)
    },
    {
      capture: true,
      onKeypress: (key) => setValue((v) => v + key)
    }
  );

  return <Text>{value}</Text>;
}
```

Flow comparison:

```
Normal mode (capture: false):
  'j' pressed → check focused node bindings → no match → bubble up → parent handles

Capture mode (capture: true):
  'j' pressed → check explicit bindings (escape, enter) → no match → onKeypress → types 'j' → STOPS
```

This generalizes beyond text inputs. A confirmation dialog captures with only `y`/`n`/`Escape` as explicit bindings and swallows everything else.

---

### 2. Focus Tree

#### Why a Tree

Focus must follow component nesting because navigation operates at multiple levels simultaneously:

```
        App
       /   \
  Sidebar   MainPanel
  / | \      /     \
 M1 M2 M3  FileList Preview
            / | \
           F1 F2 F3
               ↑ focused
```

At any moment, there's one active branch from root to leaf: `App → MainPanel → FileList → F2`. Only the leaf receives keystrokes.

Different keys navigate different levels:

- `j`/`k` move among siblings (F1, F2, F3)
- `h`/`l` or `Tab` move between the parent's siblings (Sidebar ↔ MainPanel)

A flat list can't encode this. The tree tells the framework which elements are siblings at each level.

#### API: `FocusGroup`

```tsx
function Dashboard() {
  return (
    <FocusGroup direction="horizontal">
      <Sidebar />
      <MainPanel />
      <Inspector />
    </FocusGroup>
  );
}

function Sidebar() {
  return (
    <FocusGroup direction="vertical">
      <MenuItem label="Files" />
      <MenuItem label="Search" />
      <MenuItem label="Settings" />
    </FocusGroup>
  );
}
```

`FocusGroup` creates a node in the focus tree. Its children are branches. `direction` controls which arrow keys navigate between children. Nested groups are only active when their parent group has focus.

#### API: `useFocus`

```tsx
const { focused, id, focus } = useFocus();
```

Returns whether this component is currently the focused leaf in the tree.

#### API: `useFocusState`

Declarative focus binding, inspired by SwiftUI:

```tsx
function Form() {
  const [field, setField] = useFocusState<'name' | 'email' | 'submit'>('name');

  useKeybindings({
    tab: () => setField(next(field))
  });

  return (
    <FocusGroup bind={field}>
      <TextInput id="name" label="Name" />
      <TextInput id="email" label="Email" />
      <Button id="submit" label="Submit" />
    </FocusGroup>
  );
}
```

---

### 3. Screen Router

#### Concept

A stack-based navigator for full-screen views. When a screen is pushed, the previous screen is suspended (keeps state, loses input). When popped, the previous screen resumes.

```
  ┌─────────────┐
  │  Settings   │  ← top of stack, receives all input
  ├─────────────┤
  │ CommitDetail│  ← mounted but hidden, state preserved
  ├─────────────┤
  │  Dashboard  │  ← mounted but hidden, state preserved
  └─────────────┘
```

#### How Hidden Screens Keep State

All screens in the stack stay **mounted** in the React tree. Lower screens are wrapped in `<Box display="none">`. React's fiber tree preserves all `useState`, `useRef`, `useEffect` state for mounted components — even if they produce no visual output.

```tsx
// Inside the Router
{
  stack.map((entry, i) => {
    const isTop = i === stack.length - 1;
    const Component = screens[entry.name];

    return (
      <NavigationContext.Provider key={entry.id} value={{ ...navigation, params: entry.params, active: isTop }}>
        <Box display={isTop ? 'flex' : 'none'}>
          <Component {...entry.params} />
        </Box>
      </NavigationContext.Provider>
    );
  });
}
```

The `active` flag from context is what the focus tree reads. When `active` is false, the screen's entire focus branch is ignored by the input router.

#### API

Setup:

```tsx
import { Router, Screen } from 'ink-framework';

function App() {
  return (
    <Router initial="dashboard">
      <Screen name="dashboard" component={Dashboard} />
      <Screen name="commitDetail" component={CommitDetail} />
      <Screen name="settings" component={Settings} />
    </Router>
  );
}
```

Screen components receive params as regular React props (not through a hook):

```tsx
interface CommitDetailProps {
  hash: string;
}

function CommitDetail({ hash }: CommitDetailProps) {
  const { pop } = useNavigation();

  useKeybindings({
    escape: () => pop()
  });

  return <DiffView hash={hash} />;
}
```

Navigation:

```tsx
const nav = useNavigation();
nav.push('commitDetail', { hash: 'abc123' }); // push onto stack
nav.pop(); // back to previous
nav.replace('settings', { tab: 'keys' }); // replace top of stack
nav.reset('dashboard'); // clear stack, start fresh
```

#### Type Safety

The screen registry can be typed so `push` calls are checked at compile time:

```tsx
type Screens = {
  dashboard: {};
  commitDetail: { hash: string };
  settings: { tab?: string };
};

const nav = useNavigation<Screens>();
nav.push('commitDetail', { hash: 'abc' }); // ok
nav.push('commitDetail', {}); // type error: missing hash
nav.push('bogus'); // type error: unknown screen
```

Components work both inside the router and standalone (for testing or embedding):

```tsx
// Via router
nav.push('commitDetail', { hash: 'abc123' });

// Direct render
<CommitDetail hash="abc123" />;
```

#### Dependency Injection vs Navigation Params

**Navigation params** are for screen-specific data that changes which content the screen displays:

```tsx
nav.push('commitDetail', { hash: 'abc123' });
nav.push('settings', { tab: 'keybindings' });
nav.push('fileEditor', { path: '/src/app.ts' });
```

**Shared dependencies** (API clients, configuration, theme, feature flags) should go through React context, not params:

```tsx
function App() {
  return (
    <ApiProvider client={apiClient}>
      <ThemeProvider theme={theme}>
        <ConfigProvider config={config}>
          <Router initial="dashboard">
            <Screen name="dashboard" component={Dashboard} />
            <Screen name="commitDetail" component={CommitDetail} />
            <Screen name="settings" component={Settings} />
          </Router>
        </ConfigProvider>
      </ThemeProvider>
    </ApiProvider>
  );
}

function Dashboard() {
  const api = useApi();      // from context
  const theme = useTheme();  // from context
  const nav = useNavigation();

  // Navigation params are for screen-specific data
  const onSelectCommit = (hash: string) => {
    nav.push('commitDetail', { hash });
  };
}
```

**Why context instead of static props on `<Screen>`?**

1. **Router stays simple** — Its only job is managing the navigation stack, not dependency wiring
2. **Standard React pattern** — Context is the idiomatic way to share dependencies
3. **Works with direct renders** — When testing or embedding a screen component directly, context providers work the same way
4. **Cleaner types** — Navigation params can be strictly typed per-screen without polluting the type system with every possible dependency

The Router's `params` should only contain data that determines *which* thing to show. Everything else comes from context.

#### Router Internals

```tsx
const NavigationContext = createContext(null);

function Router({ initial, children }) {
  const screens = {};
  Children.forEach(children, (child) => {
    if (child.type === Screen) {
      screens[child.props.name] = child.props.component;
    }
  });

  const [stack, setStack] = useState([{ name: initial, params: {}, id: 0 }]);
  const nextId = useRef(1);

  const navigation = useMemo(
    () => ({
      push: (name, params = {}) => {
        setStack((s) => [...s, { name, params, id: nextId.current++ }]);
      },
      pop: () => {
        setStack((s) => {
          if (s.length <= 1) return s;
          return s.slice(0, -1);
        });
      },
      replace: (name, params = {}) => {
        setStack((s) => [...s.slice(0, -1), { name, params, id: nextId.current++ }]);
      },
      reset: (name, params = {}) => {
        setStack([{ name, params, id: nextId.current++ }]);
      }
    }),
    []
  );

  return (
    <>
      {stack.map((entry, i) => {
        const isTop = i === stack.length - 1;
        const Component = screens[entry.name];
        return (
          <NavigationContext.Provider key={entry.id} value={{ ...navigation, params: entry.params, active: isTop }}>
            <Box display={isTop ? 'flex' : 'none'}>
              <Component {...entry.params} />
            </Box>
          </NavigationContext.Provider>
        );
      })}
    </>
  );
}

function Screen({ name, component }) {
  return null; // declarative registration only
}

function useNavigation() {
  return useContext(NavigationContext);
}
```

---

### 4. Responsive Components

#### Decision: Not a Framework Pillar

We explicitly decided against a breakpoint system. Terminal size variance is much smaller than web (no phone vs desktop). A breakpoint abstraction would be a web pattern cargo-culted into the terminal where it doesn't belong.

Instead, responsiveness is a **requirement for every built-in primitive**:

- A `Table` given 40 columns truncates cells or drops low-priority columns automatically
- A `List` that's 10 rows tall scrolls
- A `TextInput` works at any width

The developer describes layout with flexbox. Components measure their available space (Ink provides `measureElement`) and adapt internally. No responsive logic in application code.

#### Utility Hook

For the rare case where a developer genuinely needs terminal dimensions (e.g., removing a sidebar entirely in a very narrow terminal):

```tsx
function useTerminalSize() {
  const [size, setSize] = useState({
    columns: process.stdout.columns,
    rows: process.stdout.rows
  });

  useEffect(() => {
    const handler = () =>
      setSize({
        columns: process.stdout.columns,
        rows: process.stdout.rows
      });
    process.stdout.on('resize', handler);
    return () => process.stdout.off('resize', handler);
  }, []);

  return size;
}
```

---

### 5. Terminal Lifecycle

Hooks for terminal-level events that Ink doesn't provide. Exit handling is NOT included — Ink already owns that via `useApp().exit()`.

#### Terminal Focus Detection

Detects when the terminal gains/loses OS-level focus (user switches to another app). Uses ANSI escape sequences — the terminal emits specific sequences when focus changes, but must be opted in.

```tsx
function useTerminalFocus(callback: (focused: boolean) => void) {
  useEffect(() => {
    process.stdout.write('\x1b[?1004h'); // enable focus reporting

    const handler = (data: Buffer) => {
      const str = data.toString();
      if (str.includes('\x1b[I')) callback(true); // focus in
      if (str.includes('\x1b[O')) callback(false); // focus out
    };
    process.stdin.on('data', handler);

    return () => {
      process.stdout.write('\x1b[?1004l'); // disable focus reporting
      process.stdin.off('data', handler);
    };
  }, []);
}
```

#### Alternate Screen

Runs the app in the alternate screen buffer so it doesn't pollute the user's scrollback history. When the app exits, the original terminal content is restored (like vim or less).

```tsx
function AlternateScreen({ children }) {
  useEffect(() => {
    process.stdout.write('\x1b[?1049h'); // enter
    return () => {
      process.stdout.write('\x1b[?1049l'); // leave
    };
  }, []);

  return children;
}
```

The framework's top-level `<App>` wrapper should handle this automatically.

#### Suspend/Resume (Deferred)

Ctrl+Z support (backgrounding the process and restoring on `fg`). Deferred to a later version — most TUI apps work fine without it.

---

### 6. Shell Out

#### The Problem

TUI apps often need to hand the terminal to an external program — opening `$EDITOR`, piping output through `less`, running `git commit` (which opens an editor). This requires surrendering terminal control entirely and reclaiming it when the child process exits.

Getting the sequence wrong leaves the terminal in a broken state.

#### API: `useShellOut`

```tsx
function FileEditor({ path }) {
  const shell = useShellOut();

  useKeybindings({
    e: async () => {
      const result = await shell.run(`vim ${path}`);
      if (result.exitCode === 0) reload();
    }
  });

  return <Text>Press e to edit {path}</Text>;
}
```

#### Internal Sequence

`shell.run()` handles the full handoff:

1. Exit alternate screen
2. Stop Ink rendering
3. Release stdin/stdout to the child process
4. Spawn with `stdio: 'inherit'` so the child gets full terminal control
5. Wait for child to exit
6. Reclaim stdin/stdout
7. Re-enter alternate screen
8. Force Ink to redraw everything

```tsx
function useShellOut() {
  const { stdout, stdin } = useStdio();

  return {
    run: async (command: string) => {
      stdout.write('\x1b[?1049l'); // leave alternate screen

      const result = await execa(command, {
        stdio: 'inherit',
        shell: true
      });

      stdout.write('\x1b[?1049h'); // re-enter alternate screen
      // trigger full Ink redraw

      return result;
    }
  };
}
```

Prior art: Bubbletea provides this as `tea.Exec()`.

---

### 7. Command Palette

#### Concept

A fuzzy-searchable list of all available actions in the app, accessible via a global keybinding (e.g., `Ctrl+K`). Components register their actions into a central registry. The palette collects and displays them.

```
┌──────────────────────────────┐
│ > rename                     │
├──────────────────────────────┤
│   Rename file            r   │
│   Rename branch        F2    │
└──────────────────────────────┘
```

#### Command Registry

Components register commands declaratively. Commands are scoped — they're removed when the component unmounts.

```tsx
function FileList() {
  const { register } = useCommands();

  register([
    { name: 'Delete file', action: deleteSelected, key: 'd' },
    { name: 'Rename file', action: renameSelected, key: 'r' },
    { name: 'Copy path', action: copyPath, key: 'ctrl+c' }
  ]);
}
```

#### Context Awareness

Commands can be scoped to when the registering component is focused or merely mounted:

```tsx
register([
  { name: 'Delete file', action: deleteSelected, when: 'focused' },
  { name: 'Search files', action: openSearch, when: 'mounted' }
]);
```

- `when: 'focused'` — only appears in palette when the registering component is the focused leaf
- `when: 'mounted'` — appears whenever the registering component is mounted (any screen containing it)

#### Unification with Keybindings

Keybindings and command palette entries should be declared together. One declaration gives you both the keyboard shortcut and palette discoverability:

```tsx
useKeybindings({
  d: { action: deleteSelected, name: 'Delete file' },
  r: { action: renameSelected, name: 'Rename file' }
});
```

This single declaration:

1. Binds the key so it works when focused
2. Registers it in the command palette with the key hint displayed
3. Removes it from the palette when the component unmounts

#### Palette Component

The palette itself is a framework-provided component. It's a `FocusTrap` with capture mode — takes over all input while open, dismisses on `Escape`. It reads from the command registry, fuzzy-matches the search query against registered commands, and executes the selected command.

---

## Decisions

- **React hooks + context** as the programming model. Borrows the input-routing constraint from Elm/Bubbletea but stays React-idiomatic.
- **Single root input listener** that dispatches through the focus tree. No per-component `useInput`.
- **Unhandled keys bubble up** the focus tree. `FocusTrap` available when swallowing is needed.
- **Hidden screens stay mounted** with `display="none"`. React preserves state automatically — no serialization needed.
- **Screen params spread as props** so components are normal React components that work standalone.
- **Explicit screen registration**, not file-based routing.
- **No breakpoint system.** Components adapt to available space internally. `useTerminalSize()` available as a utility.
- **Exit handling uses Ink's `useApp().exit()`** — don't duplicate what Ink provides.
- **Suspend/resume, theming, testing, async patterns** deferred. Not structural primitives.

---

## Package Structure

The framework ships as a single npm package with subpath exports for clear separation of concerns:

```tsx
import { ... } from 'giggles';           // Core framework
import { ... } from 'giggles/headless';  // Headless UI primitives
import { ... } from 'giggles/ui';        // Styled UI components
```

### `giggles` — Core Framework

The base import provides all structural primitives:

```tsx
import {
  // Router
  Router,
  Screen,
  useNavigation,

  // Focus system
  FocusGroup,
  FocusTrap,
  useFocus,
  useFocusState,

  // Input
  useKeybindings,

  // Command palette
  useCommands,
  CommandPalette,

  // Terminal lifecycle
  AlternateScreen,
  useTerminalFocus,
  useTerminalSize,
  useShellOut
} from 'giggles';
```

These are always needed for any non-trivial app. They're small (mostly hooks and context) and tree-shakeable.

### `giggles/headless` — Headless UI Primitives

Provides component behavior without visual opinions. Use these when you need full control over rendering:

```tsx
import { TextInput, Select, Table, Modal } from 'giggles/headless';

// Or namespace to avoid conflicts with styled components
import * as Headless from 'giggles/headless';

<Headless.TextInput.Root>
  <Headless.TextInput.Input render={...} />
</Headless.TextInput.Root>
```

Each headless component exposes compound components (`.Root`, `.Input`, `.Label`, etc.) and render props for full customization.

### `giggles/ui` — Styled UI Components

Provides ready-to-use components with sensible defaults. Use these for rapid development:

```tsx
import { TextInput, Select, Table, Modal } from 'giggles/ui';

<TextInput
  label="Name"
  value={name}
  onChange={setName}
  placeholder="Enter your name"
/>
```

Styled components are thin wrappers around headless primitives. Internally, `giggles/ui` imports from `giggles/headless` and provides default `render` implementations.

### Why Subpath Exports (Not Separate Packages)

- **Single install** — `npm install giggles` gets everything
- **Version coordination** — No risk of mismatched versions between `@giggles/core`, `@giggles/headless`, and `@giggles/ui`
- **Tree-shaking** — Modern bundlers only include what you import
- **Simpler mental model** — One package, three import paths
- **All layers integrate tightly** — Headless and styled components both depend on core focus/input systems

The framework is distributed as one package but organized into logical import paths for clarity.

---

## Summary of Exports

### Hooks

- `useKeybindings(bindings, options?)` — Focus-scoped key handling with optional capture mode
- `useFocus()` — Returns `{ focused, id, focus() }`
- `useFocusState<T>(initial)` — Declarative focus binding to an enum
- `useNavigation<T>()` — Screen navigation: `push`, `pop`, `replace`, `reset`
- `useCommands()` — Register commands into the command palette
- `useShellOut()` — Hand terminal to external processes
- `useTerminalFocus(callback)` — OS-level terminal focus/blur
- `useTerminalSize()` — Reactive terminal dimensions

### Components

- `<Router>` — Screen stack manager
- `<Screen>` — Screen registration (declarative, renders nothing)
- `<FocusGroup>` — Creates a node in the focus tree, manages child navigation
- `<FocusTrap>` — Prevents input from bubbling past this point
- `<AlternateScreen>` — Runs children in alternate screen buffer
- `<CommandPalette>` — Fuzzy-searchable action list (reads from command registry)

### Built-in UI Primitives

#### Two-Tier Architecture

The framework provides UI components in two forms:

1. **Headless primitives** — Pure behavior and logic (focus management, keyboard handling, state machines) with no visual opinions
2. **Styled components** — Thin wrappers around headless primitives with sensible default styling

This is inspired by Radix UI and Headless UI from the web ecosystem. Most users can use the styled components and get a polished experience out of the box. Power users can drop down to headless primitives for full control.

**Example: TextInput**

Headless primitive (full control):

```tsx
import { TextInput } from 'ink-framework/headless';

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
import { TextInput } from 'ink-framework';

function SimpleInput() {
  const [value, setValue] = useState('');

  return (
    <TextInput
      label="Enter your name:"
      value={value}
      onChange={setValue}
      placeholder="John Doe"
    />
  );
}
```

The styled component internally uses the headless primitive. It's just a convenience wrapper with default styling decisions.

**Why This Matters**

- **Progressive disclosure** — Start simple, drop down when you need customization
- **Maintainability** — Behavior lives in one place (headless), styling is just a wrapper
- **No fighting defaults** — When the styled component doesn't fit, use headless instead of overriding styles
- **Testability** — Headless primitives are easier to unit test (pure logic, no rendering)
- **Consistency** — All styled components share the same visual language, but you can customize individual pieces

**Implementation Note**

Headless components expose their behavior through:
- Compound components (`Root`, `Input`, `Label`, etc.)
- Render props for full rendering control
- State and event handlers
- Focus management integration with the framework's focus tree

Styled components are just React components that compose headless primitives with default `render` implementations.

#### Planned Components

All components below will ship in both headless and styled forms:

- **Input**: `TextInput`, `Select`, `MultiSelect`, `Confirm`, `Autocomplete`
- **Layout**: `Split`, `Tabs`
- **Display**: `Table`, `VirtualList`, `Spinner`, `Badge`, `Markdown`
- **Overlay**: `Modal`, `Dialog`, `Toast`
- **Chrome**: `StatusBar`, `Breadcrumb`, `KeyHints`

Each component handles responsive behavior internally (adapts to available space, scrolls when necessary, truncates intelligently). Developers describe layout with flexbox; components measure and adapt.
