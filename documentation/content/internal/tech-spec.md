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
  - We explicitly decided against a breakpoint system. Terminal size variance is much smaller than web (no phone vs desktop). A breakpoint abstraction would be a web pattern cargo-culted into the terminal where it doesn't belong.
  - Examples: A `Table` given 40 columns truncates cells or drops low-priority columns automatically. A `List` that's 10 rows tall scrolls. A `TextInput` works at any width.
  - Components measure their available space (Ink provides `measureElement`) and adapt internally. No responsive logic in application code.
- **Don't over-abstract.** Ship utilities, not opinions. `useTerminalSize()` is a hook, not a breakpoint system. The framework provides tools; the developer decides when to use them.
- **React-idiomatic.** Hooks, context, JSX. No new programming models. A React developer should feel at home immediately.

## Prior Art

- **Bubbletea (Go)** — Elm architecture for TUIs. Single `Update` function receives all input as messages, routes explicitly. Prevents input leaking by design. Our input system borrows this constraint but implements it with React patterns.
- **React Navigation (React Native)** — Stack-based screen navigation with automatic focus management. Our screen router is modeled directly on this.
- **SwiftUI `@FocusState`** — Declarative focus binding to an enum. Inspired our `useFocusState()` hook.
- **Vim/Tmux** — Modal input (insert mode vs normal mode). Inspired our fallback handler for text inputs.

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
- **Two-tier component architecture** — Unstyled primitives for full control, styled components for convenience.
- **Phased development** — Build the foundation first, then components, then DX utilities.

---

## Package Structure

The framework ships as a single npm package with subpath exports for clear separation of concerns:

```tsx
import { ... } from 'giggles';             // Core framework
import { ... } from 'giggles/primitives';  // Unstyled UI primitives
import { ... } from 'giggles/ui';          // Styled UI components
```

### `giggles` — Core Framework

The base import provides all structural primitives:

```tsx
import {
  // Terminal lifecycle
  AlternateScreen, // Command palette
  CommandPalette, // Focus system
  FocusGroup,
  FocusTrap, // Router
  Router,
  Screen,
  useFocus,
  useFocusState,
  useKeybindingRegistry, // Input
  useKeybindings,
  useNavigation,
  useShellOut,
  useTerminalFocus,
  useTerminalSize
} from 'giggles';
```

These are always needed for any non-trivial app. They're small (mostly hooks and context) and tree-shakeable.

### `giggles/primitives` — Unstyled UI Primitives

Provides component behavior without visual opinions. Use these when you need full control over rendering:

```tsx
import { TextInput, Select, Table, Modal } from 'giggles/primitives';

// Or namespace to avoid conflicts with styled components
import * as Primitives from 'giggles/primitives';

<Primitives.TextInput.Root>
  <Primitives.TextInput.Input render={...} />
</Primitives.TextInput.Root>
```

Each primitive component exposes compound components (`.Root`, `.Input`, `.Label`, etc.) and render props for full customization.

### `giggles/ui` — Styled UI Components

Provides ready-to-use components with sensible defaults. Use these for rapid development:

```tsx
import { Modal, Select, Table, TextInput } from 'giggles/ui';

<TextInput label="Name" value={name} onChange={setName} placeholder="Enter your name" />;
```

Styled components are thin wrappers around primitives. Internally, `giggles/ui` imports from `giggles/primitives` and provides default `render` implementations.

### Why Subpath Exports (Not Separate Packages)

- **Single install** — `npm install giggles` gets everything
- **Version coordination** — No risk of mismatched versions between `@giggles/core`, `@giggles/primitives`, and `@giggles/ui`
- **Tree-shaking** — Modern bundlers only include what you import
- **Simpler mental model** — One package, three import paths
- **All layers integrate tightly** — Primitives and styled components both depend on core focus/input systems

The framework is distributed as one package but organized into logical import paths for clarity.

---

## Summary of Exports

### Hooks

- `useKeybindings(bindings, options?)` — Focus-scoped key handling with optional fallback handler and command palette registration
- `useKeybindingRegistry()` — Returns `{ all, available, local }` keybinding views for custom UI (used by CommandPalette)
- `useFocus()` — Returns `{ focused, id, focus() }`
- `useFocusState<T>(initial)` — Declarative focus binding to an enum
- `useNavigation<T>()` — Screen navigation: `push`, `pop`, `replace`, `reset`
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

### UI Primitives

All components below will ship in both primitive (`giggles/primitives`) and styled (`giggles/ui`) forms:

- **Input**: `TextInput`, `Select`, `MultiSelect`, `Confirm`, `Autocomplete`
- **Layout**: `Split`, `Tabs`
- **Display**: `Table`, `VirtualList`, `Spinner`, `Badge`, `Markdown`
- **Overlay**: `Modal`, `Dialog`, `Toast`
- **Chrome**: `StatusBar`, `Breadcrumb`, `KeyHints`
