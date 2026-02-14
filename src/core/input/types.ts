import type { Key } from 'ink';

/**
 * Handler function for a key binding.
 *
 * If a binding exists for a key, the handler will be called and the input will stop bubbling.
 * Unhandled keys (those without bindings) automatically bubble up to parent components.
 *
 * For conditional handling, either:
 * - Register bindings conditionally based on component state, or
 * - Use internal logic within the handler to decide whether to perform an action
 *
 * @param input - The character string for the key pressed (e.g., 'j', 'q')
 * @param key - Ink's Key object with boolean properties (downArrow, return, escape, etc.)
 *
 * @example
 * ```tsx
 * useKeybindings(focus, {
 *   j: () => moveDown(),
 *   k: () => moveUp(),
 *   return: () => selectItem()
 * });
 * ```
 */
export type KeyHandler = (input: string, key: Key) => void;

type SpecialKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'backspace'
  | 'delete'
  | 'pageup'
  | 'pagedown'
  | 'home'
  | 'end';

type KeyName = SpecialKey | (string & {});

export type Keybindings = Partial<Record<KeyName, KeyHandler>>;

export type KeybindingOptions = {
  capture?: boolean;
  onKeypress?: (input: string, key: Key) => void;
  layer?: string;
};

export type RegisteredKeybinding = {
  nodeId: string;
  key: string;
  handler: KeyHandler;
  layer?: string;
};

export type { Key } from 'ink';
