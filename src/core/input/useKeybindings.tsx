import { useEffect } from 'react';
import type { FocusHandle } from '../focus/useFocus';
import { useInputContext } from './InputContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(focus: FocusHandle, bindings: Keybindings, options?: KeybindingOptions) {
  const { registerKeybindings, unregisterKeybindings } = useInputContext();

  registerKeybindings(focus.id, bindings, options);

  useEffect(() => {
    return () => unregisterKeybindings(focus.id);
  }, [focus.id, unregisterKeybindings]);
}
