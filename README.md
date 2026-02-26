[![CI](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml)
[![CD](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml)
[![docs](https://img.shields.io/badge/docs-giggles.zzzzion.com-blue)](https://giggles.zzzzion.com)

# giggles

<img src="https://github.com/user-attachments/assets/c5c7ef05-232f-4180-8b85-0160fb0f083a" width="700" alt="giggles">

giggles is a batteries-included react framework for building terminal apps. built on ink, it handles focus, input routing, screen navigation, and theming out of the box so you can skip the plumbing and build.

inspired by the [charmbracelet](https://github.com/charmbracelet) ecosystem, it comes with a rich set of UI components, hooks for focus and navigation management, and terminal utilities for things like running shell commands.

## features

- each component owns its keys — a text input inside a list inside a panel all work independently, with unhandled keys naturally passing up to the right parent. no global input handler, no coordination code
- navigate between views with a simple API; the previously focused component is restored when you return
- a full set of hooks and components — `useFocusScope`, `useFocusNode`, `FocusTrap`, `useNavigation`, and more — for building any interaction pattern without reimplementing the plumbing
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

## giggles/ui

### [select](https://giggles.zzzzion.com/ui/select)

<img src="https://github.com/user-attachments/assets/8ce13f75-7a7b-4123-a973-f2992193bf84" width="500" alt="select">

### [multi select](https://giggles.zzzzion.com/ui/multi-select)

<img src="https://github.com/user-attachments/assets/24f5d625-6e46-4cb1-8d22-42d40eb48f56" width="500" alt="multi-select">

### [markdown](https://giggles.zzzzion.com/ui/markdown)

<img src="https://github.com/user-attachments/assets/1cdb6e84-c714-470a-8cf0-b6abf68b78a9" width="500" alt="markdown">

### [text input](https://giggles.zzzzion.com/ui/text-input)

<img src="https://github.com/user-attachments/assets/b56056ca-97e2-4dc2-a1eb-2ee3f4d559e7" width="500" alt="text-input">

### [viewport](https://giggles.zzzzion.com/ui/viewport)

<img src="https://github.com/user-attachments/assets/56c6cb6b-b2a7-4803-bed4-c6c6c34042c3" width="500" alt="viewport">

### [code block](https://giggles.zzzzion.com/ui/codeblock)

<img src="https://github.com/user-attachments/assets/283dbd7e-326c-4acb-b8c0-d3608722952b" width="500" alt="codeblock">

### [confirm](https://giggles.zzzzion.com/ui/confirm)

<img src="https://github.com/user-attachments/assets/b887da72-bf02-4084-b846-8b90cc3c3487" width="500" alt="confirm">

### [spinner](https://giggles.zzzzion.com/ui/spinner)

<img src="https://github.com/user-attachments/assets/71aef7f8-e53b-4876-864f-b9b1a5100c5d" width="500" alt="spinner">

### [modal](https://giggles.zzzzion.com/ui/modal)

<img src="https://github.com/user-attachments/assets/7415c554-927e-4b5c-91d7-7e3b1f4ea0ca" width="500" alt="modal">

### [paginator](https://giggles.zzzzion.com/ui/paginator)

<img src="https://github.com/user-attachments/assets/b0780f46-848e-4881-822a-86d7db02d212" width="500" alt="paginator">

### [autocomplete](https://giggles.zzzzion.com/ui/autocomplete)

<img src="https://github.com/user-attachments/assets/aa76dd7a-5357-4969-a979-95975b5ec578" width="500" alt="autocomplete">

### [command palette](https://giggles.zzzzion.com/ui/command-palette)

<img src="https://github.com/user-attachments/assets/30886cb5-986f-4477-85c1-61cba4b499aa" width="500" alt="command-palette">

### [virtual list](https://giggles.zzzzion.com/ui/virtual-list)

<img src="https://github.com/user-attachments/assets/d3ef1d92-813c-4546-8d60-2c38745ddbbc" width="500" alt="virtual-list">

### [badge](https://giggles.zzzzion.com/ui/badge)

<img src="https://github.com/user-attachments/assets/b144c3f5-8b3b-4236-abf2-fc239d23f0c6" width="500" alt="badge">

### [panel](https://giggles.zzzzion.com/ui/panel)

<img src="https://github.com/user-attachments/assets/9831d73a-baa9-410a-b933-e0dfd9433604" width="500" alt="panel">

## giggles/terminal

### [useShellOut](https://giggles.zzzzion.com/terminal#useshellout)

suspend the UI, hand off the terminal to an external program like `vim` or `less`, and resume cleanly when it exits

### [useSpawn](https://giggles.zzzzion.com/terminal#usespawn)

spawn a child process and stream its stdout/stderr output into your UI — with support for colored output via a pty

### [useTerminalSize](https://giggles.zzzzion.com/terminal#useterminalsize)

reactively track the terminal's current dimensions (rows and columns), updating on resize

### [useTerminalFocus](https://giggles.zzzzion.com/terminal#useterminalfocus)

detect when the terminal window gains or loses focus
