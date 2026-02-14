import { useEffect } from 'react';
import { useFocus } from '../focus';
import { useInputContext } from './InputContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(bindings: Keybindings, options?: KeybindingOptions) {
  const { id } = useFocus();
  const { registerKeybindings, unregisterKeybindings } = useInputContext();

  registerKeybindings(id, bindings, options);

  useEffect(() => {
    return () => unregisterKeybindings(id);
  }, [id, unregisterKeybindings]);
}
