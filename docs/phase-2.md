# Phase 2 — Utilities & Developer Experience

These utilities build on top of the core framework (Phase 1) and can be added incrementally without architectural changes. They are **deferred** because they're not architectural primitives — they build on the core framework (input routing, focus management, navigation, lifecycle) without changing its design.

---

## Logging and Debugging

TUI apps can't use `console.log` without breaking the rendering. A structured logging system is essential:

```tsx
import { useLogger } from 'giggles';

const log = useLogger();
log.debug('User selected:', item);
log.error('Failed to load file:', error);
```

Logs could be written to a file, displayed in a toggleable debug panel, or sent to a separate TTY.

---

## Testing Utilities

Helpers for simulating input and asserting focus/render state:

```tsx
import { render, fireKey, waitFor } from 'giggles/testing';

test('file navigation', async () => {
  const { focusedNode } = render(<FileList />);

  fireKey('j');
  await waitFor(() => expect(focusedNode()).toBe('file2.txt'));

  fireKey('enter');
  expect(onOpen).toHaveBeenCalledWith('file2.txt');
});
```

Essential for building confidence in TUI behavior without manual testing.

---

## Form State Management

Validation, dirty tracking, and submission state for forms and prompts:

```tsx
import { useForm } from 'giggles';

const form = useForm({
  name: { required: true, minLength: 2 },
  email: { required: true, pattern: emailRegex }
});

<form.Field name="name">
  {({ value, error, onChange }) => (
    <TextInput value={value} onChange={onChange} error={error} />
  )}
</form.Field>
```

Forms are a common pattern in TUIs (configuration screens, commit messages, user prompts).

---

## Clipboard Integration

Cross-platform clipboard access (pbcopy/pbpaste on macOS, xclip on Linux, clip on Windows):

```tsx
import { useClipboard } from 'giggles';

const clipboard = useClipboard();

useKeybindings({
  'ctrl+c': () => clipboard.write(selectedText),
  'ctrl+v': async () => handlePaste(await clipboard.read())
});
```

Handles platform differences automatically so developers don't have to.

---

## Mouse Event Integration

Structured mouse support integrated with the focus system:

```tsx
import { useMouse } from 'giggles';

useMouse({
  onClick: (x, y) => selectItemAt(y),
  onScroll: (delta) => scrollBy(delta)
}, { captureWhenFocused: true });
```

Mouse clicks could auto-focus components, scroll events could work on focused containers. Ink supports mouse events but there's no structured way to integrate with the focus system.

---

## Background Tasks with Progress

Long-running operations with UI feedback:

```tsx
import { useBackgroundTask } from 'giggles';

const task = useBackgroundTask();

await task.run(async (progress) => {
  progress.update({ message: 'Cloning repository...', percent: 25 });
  // ... perform work
  progress.update({ message: 'Installing dependencies...', percent: 75 });
  // ... more work
  progress.update({ message: 'Done!', percent: 100 });
});

<ProgressBar task={task} />
```

Critical for operations like git clone, npm install, file processing, etc.

---

## Theming System

Consistent colors and styles across components:

```tsx
import { ThemeProvider } from 'giggles';

<ThemeProvider theme={{
  colors: {
    primary: 'cyan',
    danger: 'red',
    muted: 'gray',
    success: 'green'
  },
  borderStyle: 'round'
}}>
  <App />
</ThemeProvider>
```

Allows apps to have consistent visual identity. Components would read theme values via `useTheme()`.

---

## Error Boundaries

TUI-specific error handling that preserves graceful exit:

```tsx
<ErrorBoundary
  fallback={({ error, reset }) => (
    <ErrorScreen error={error} onRetry={reset} />
  )}
>
  <FileExplorer />
</ErrorBoundary>
```

When a component crashes, show a friendly error screen instead of crashing the entire app. User should still be able to exit gracefully.

---

## Priority

**High priority** (core developer experience):
- Logging and debugging
- Testing utilities

**Medium priority** (common patterns):
- Form state management
- Clipboard integration
- Background tasks with progress

**Lower priority** (polish):
- Mouse event integration
- Theming system
- Error boundaries
