[![CI](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml)
[![CD](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml)
[![docs](https://img.shields.io/badge/docs-giggles.zzzzion.com-blue)](https://giggles.zzzzion.com)

# giggles

![giggles](https://github.com/user-attachments/assets/c5c7ef05-232f-4180-8b85-0160fb0f083a)

giggles is a batteries-included react framework for building terminal apps. built on ink, it handles focus, input routing, screen navigation, and theming out of the box so you can skip the plumbing and build.

inspired by the [charmbracelet](https://github.com/charmbracelet) ecosystem, it comes with a rich set of UI components, hooks for focus and navigation management, and terminal utilities for things like running shell commands.

## features

- no `useInput` hooks scattered across your app — focus, input routing, and keyboard navigation are handled for you
- navigate between views with a simple API; the previously focused component is restored when you return
- a full set of hooks and components — `useFocus`, `FocusGroup`, `FocusTrap`, `useNavigation`, and more — for building any interaction pattern without reimplementing the plumbing
- built-in keybinding registry so your app can always show users what keys do what, in the current context — context-aware and accessible via a hook
- a component library covering most TUI use cases, from text inputs and autocomplete to virtual lists for large datasets — with sensible defaults and render props for full customization
- render markdown in the terminal, with full formatting and syntax-highlighted code block and diff support
- hand off terminal control to external programs like `vim` or `less` and reclaim it cleanly when they exit, or spawn processes and stream their output directly into your UI
- a consistent look out of the box, customizable from a single theme object

## your first TUI

to get started, run

```bash
npx create-giggles-app
```

see [giggles.zzzzion.com](https://giggles.zzzzion.com) for API documentation and live demos.
