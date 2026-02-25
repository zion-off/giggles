import { useEffect, useId, useRef } from 'react';
import { useStore } from '../focus/StoreContext';
import { KeybindingOptions, Keybindings } from './types';

export function useKeybindings(focus: { id: string }, bindings: Keybindings, options?: KeybindingOptions) {
  const store = useStore();
  const registrationId = useId();
  const nodeIdRef = useRef(focus.id);

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
