import { useContext, useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { ScopeIdContext, useStore } from './StoreContext';
import type { FocusScopeHandle } from './useFocusScope';

export type FocusNodeHandle = {
  id: string;
  hasFocus: boolean;
};

export type FocusNodeOptions = {
  // Explicit parent — use when creating a node in the same component as its
  // parent scope, bypassing ScopeIdContext.
  parent?: FocusScopeHandle;
};

export function useFocusNode(options?: FocusNodeOptions): FocusNodeHandle {
  const id = useId();
  const store = useStore();
  const contextParentId = useContext(ScopeIdContext);

  const parentId = options?.parent?.id ?? contextParentId;

  const subscribe = useMemo(() => store.subscribe.bind(store), [store]);

  useEffect(() => {
    store.registerNode(id, parentId);
    return () => {
      store.unregisterNode(id);
    };
  }, [id, parentId, store]);

  const hasFocus = useSyncExternalStore(subscribe, () => store.isFocused(id));

  return { id, hasFocus };
}
