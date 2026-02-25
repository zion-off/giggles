import { useEffect, useId } from 'react';
import { useStore } from '../focus/StoreContext';
import type { Keybindings } from './types';

export function useGlobalKeybindings(bindings: Keybindings): void {
  const store = useStore();
  const nodeId = useId();
  const registrationId = useId();

  store.registerGlobalKeybindings(nodeId, registrationId, bindings);

  useEffect(() => {
    return () => store.unregisterKeybindings(nodeId, registrationId);
  }, [nodeId, registrationId, store]);
}
