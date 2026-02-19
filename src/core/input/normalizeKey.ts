import type { Key } from 'ink';

export function normalizeKey(input: string, key: Key): string {
  if (input === '\x1b[I' || input === '\x1b[O') return '';

  if (key.downArrow) return 'down';
  if (key.upArrow) return 'up';
  if (key.leftArrow) return 'left';
  if (key.rightArrow) return 'right';
  if (key.return) return 'enter';
  if (key.escape) return 'escape';
  if (key.tab && key.shift) return 'shift+tab';
  if (key.tab) return 'tab';
  if (input === '\x1b[3~') return 'delete';
  if (key.backspace || key.delete) return 'backspace';
  if (key.pageUp) return 'pageup';
  if (key.pageDown) return 'pagedown';
  if (key.home) return 'home';
  if (key.end) return 'end';

  if (key.ctrl && input.length === 1) {
    return `ctrl+${input}`;
  }

  return input;
}
