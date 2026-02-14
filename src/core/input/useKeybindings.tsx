import { useEffect } from 'react';
import { useInputContext } from './InputContext';
import { KeybindingOptions, Keybindings } from './types';

/**
 * Registers keybindings that only fire when this component is focused.
 *
 * Solves Ink's global `useInput` problem by routing keypresses through the focus tree.
 * Only the focused component receives input. Unhandled keys bubble up to parent components.
 *
 * @param focus - The focus handle from `useFocus()`. Ties bindings to this component's focus node.
 * @param bindings - Map of key names to handler functions. Handlers only fire when focused.
 * @param options - Optional configuration for capture mode, keypress handlers, and layers.
 *
 * @example
 * ```tsx
 * function FileList() {
 *   const focus = useFocus();
 *
 *   useKeybindings(focus, {
 *     j: () => moveDown(),
 *     k: () => moveUp(),
 *     enter: () => openFile()
 *   });
 *
 *   return <List focused={focus.focused} items={files} />;
 * }
 * ```
 *
 * @example Capture mode for text input
 * ```tsx
 * function TextInput() {
 *   const focus = useFocus();
 *   const [value, setValue] = useState('');
 *
 *   useKeybindings(
 *     focus,
 *     {
 *       escape: () => blur(),
 *       enter: () => submit(value)
 *     },
 *     {
 *       capture: true,
 *       onKeypress: (key) => setValue(v => v + key)
 *     }
 *   );
 *
 *   return <Text>{value}</Text>;
 * }
 * ```
 */
export function useKeybindings(focus: { id: string }, bindings: Keybindings, options?: KeybindingOptions) {
  const { registerKeybindings, unregisterKeybindings } = useInputContext();

  registerKeybindings(focus.id, bindings, options);

  useEffect(() => {
    return () => unregisterKeybindings(focus.id);
  }, [focus.id, unregisterKeybindings]);
}
