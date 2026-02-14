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
 * @param input - The input string representing the key pressed (e.g., 'j', 'enter', 'ctrl+c')
 * @param key - Object containing key metadata (modifiers like ctrl, shift, meta, etc.)
 *
 * @example
 * ```tsx
 * useKeybindings({
 *   j: () => moveDown(),
 *   k: () => moveUp(),
 *   enter: () => selectItem()
 * });
 * ```
 */
export type KeyHandler = (input: string, key: Key) => void;

export type Keybindings = Record<string, KeyHandler>;

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
