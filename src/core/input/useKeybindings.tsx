import { useEffect } from 'react';
import { useInputContext } from './InputContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(focus: { id: string }, bindings: Keybindings, options?: KeybindingOptions) {
  const { registerKeybindings, unregisterKeybindings } = useInputContext();

  registerKeybindings(focus.id, bindings, options);

  useEffect(() => {
    return () => unregisterKeybindings(focus.id);
  }, [focus.id, unregisterKeybindings]);
}
