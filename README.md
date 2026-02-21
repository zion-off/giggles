[![CI](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-ci.yml)
[![CD](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml/badge.svg)](https://github.com/zion-off/giggles/actions/workflows/giggles-cd.yml)
[![docs](https://img.shields.io/badge/docs-giggles.zzzzion.com-blue)](https://giggles.zzzzion.com)

# giggles

giggles is a batteries-included react framework for building terminal apps. built on ink, it handles focus, input routing, screen navigation, and theming out of the box so you can skip the plumbing and build.

inspired by the [charmbracelet](https://github.com/charmbracelet) ecosystem, it comes with a rich set of UI components, hooks for focus and navigation management, and terminal utilities for things like running shell commands.

to get started, run

```bash
npx create-giggles-app
```

see [giggles.zzzzion.com](https://giggles.zzzzion.com) for API documentation and live demos.

## sample ui components

for a full list of UI components, see [giggles/ui](https://giggles.zzzzion.com/ui). here are a few samples:

### viewport

![viewport](https://github.com/user-attachments/assets/df6ec2fd-cb15-4359-9e3d-1f41431e7853)

### markdown

<img width="594" height="603" alt="image" src="https://github.com/user-attachments/assets/fc5648e4-3791-450c-adea-44b7057db071" />

### code block

supports syntax highlighting with [prism](https://prismjs.com/index.html#supported-languages). just import 'prism/language' and you're good to go!

<img width="548" height="527" alt="code-block" src="https://github.com/user-attachments/assets/fd9952fa-55ea-4c70-aadb-7a772d791018" />

### multi-select

![multi-select](https://github.com/user-attachments/assets/7acc3b61-7f11-4168-bd1c-ef847a5f266a)

### spinner

ported from [charmbracelet/bubbles](https://github.com/charmbracelet/bubbles/blob/master/spinner/spinner.go).

![spinner](https://github.com/user-attachments/assets/4d6af189-8bb5-4539-9f7e-23aeb7487737)
