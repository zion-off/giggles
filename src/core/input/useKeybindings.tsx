import { useEffect, useId, useRef } from 'react';
import type { FocusHandle } from '../focus';
import { useStore } from '../focus/StoreContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(focus: FocusHandle, bindings: Keybindings, options?: KeybindingOptions) {
  const store = useStore();
  const registrationId = useId();
  const nodeIdRef = useRef(focus.id);

  // Update ref if focus.id changes
  nodeIdRef.current = focus.id;

  // Register/update bindings synchronously on every render so handlers always
  // capture the latest closed-over values and are ready for the next keypress.
  store.registerKeybindings(nodeIdRef.current, registrationId, bindings, options);

  useEffect(() => {
    return () => {
      store.unregisterKeybindings(nodeIdRef.current, registrationId);
    };
  }, [registrationId, store]);
}
