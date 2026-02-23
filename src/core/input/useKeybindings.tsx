import { useEffect, useId, useRef } from 'react';
import type { FocusHandle } from '../focus';
import { useInputContext } from './InputContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(focus: FocusHandle, bindings: Keybindings, options?: KeybindingOptions) {
  const { registerKeybindings, unregisterKeybindings } = useInputContext();
  const registrationId = useId();
  const nodeIdRef = useRef(focus.id);

  // Update ref if focus.id changes
  nodeIdRef.current = focus.id;

  // Register/update bindings synchronously on every render
  registerKeybindings(nodeIdRef.current, registrationId, bindings, options);

  useEffect(() => {
    return () => {
      unregisterKeybindings(nodeIdRef.current, registrationId);
    };
  }, [registrationId, unregisterKeybindings]);
}
