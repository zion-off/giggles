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

/**
 * Map of key names to handler functions.
 *
 * Keys are strings that match either:
 * - Special keys (autocompleted): 'enter', 'escape', 'up', 'down', etc.
 * - Character keys: 'j', 'k', 'a', '?', etc.
 * - Modified keys: 'ctrl+c', 'ctrl+q', etc.
 *
 * @example
 * ```tsx
 * const bindings: Keybindings = {
 *   j: () => moveDown(),
 *   k: () => moveUp(),
 *   enter: () => selectItem(),
 *   'ctrl+q': () => quit()
 * };
 * ```
 */
export type Keybindings = Partial<Record<KeyName, KeyHandler>>;

/**
 * Options for configuring keybinding behavior.
 */
export type KeybindingOptions = {
  /**
   * Enable capture mode. When true, explicit bindings are checked first,
   * then all remaining keystrokes go to `onKeypress`. Nothing bubbles.
   *
   * Used for text inputs and components that need to receive all keystrokes.
   */
  capture?: boolean;

  /**
   * Handler for keystrokes in capture mode that don't match explicit bindings.
   *
   * Only called when `capture` is true.
   */
  onKeypress?: (input: string, key: Key) => void;

  /**
   * Optional layer identifier for organizing keybindings.
   *
   * Can be used for debugging or building tooling that inspects keybindings.
   * Has no effect on input routing behavior.
   */
  layer?: string;
};

export type RegisteredKeybinding = {
  nodeId: string;
  key: string;
  handler: KeyHandler;
  layer?: string;
};

export type { Key } from 'ink';
