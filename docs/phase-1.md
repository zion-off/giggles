# Core Framework

The foundational architectural primitives that solve the core problems of building complex TUI applications.

## Progress

| Feature       | Status      |
| ------------- | ----------- |
| Input System  | Not Started |
| Focus Tree    | Not Started |
| Screen Router | Not Started |

---

## 1. Input System

### The Problem

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

### The Solution

A single root-level `useInput` listener owned by the framework. It checks the focus tree, finds the focused component, and dispatches the keypress only to that component's keybinding handler. Other components never see it.

### API: `useKeybindings`

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

### Bubbling

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

### Capture Mode

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

## 2. Focus Tree

### Why a Tree

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

### API: `FocusGroup`

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

### API: `useFocus`

```tsx
const { focused, id, focus } = useFocus();
```

Returns whether this component is currently the focused leaf in the tree.

### API: `useFocusState`

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

## 3. Screen Router

### Concept

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

### How Hidden Screens Keep State

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

### API

Setup:

```tsx
import { Router, Screen } from 'giggles';

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

### Type Safety

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

### Dependency Injection vs Navigation Params

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
  const api = useApi(); // from context
  const theme = useTheme(); // from context
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

The Router's `params` should only contain data that determines _which_ thing to show. Everything else comes from context.

### Router Internals

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
