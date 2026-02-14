# Terminal Utilities

Terminal-level utilities that build on the core framework.

## Progress

| Feature                                                | Status      |
| ------------------------------------------------------ | ----------- |
| Terminal Size Hook                                     | Not Started |
| Terminal Lifecycle (Focus Detection, Alternate Screen) | Not Started |
| Shell Out                                              | Not Started |

---

## 1. Terminal Size Hook

Provides reactive terminal dimensions for the rare case where a developer genuinely needs them (e.g., removing a sidebar entirely in a very narrow terminal).

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

## 2. Terminal Lifecycle

Hooks for terminal-level events that Ink doesn't provide. Exit handling is NOT included — Ink already owns that via `useApp().exit()`.

### Terminal Focus Detection

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

### Alternate Screen

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

### Suspend/Resume (Deferred)

Ctrl+Z support (backgrounding the process and restoring on `fg`). Deferred to a later version — most TUI apps work fine without it.

---

## 3. Shell Out

### The Problem

TUI apps often need to hand the terminal to an external program — opening `$EDITOR`, piping output through `less`, running `git commit` (which opens an editor). This requires surrendering terminal control entirely and reclaiming it when the child process exits.

Getting the sequence wrong leaves the terminal in a broken state.

### API: `useShellOut`

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

### Internal Sequence

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
