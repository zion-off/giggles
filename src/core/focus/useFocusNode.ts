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
  // Key used to address this node from the parent scope via focusChild/focusChildShallow.
  // Scoped to the immediate parent — no global namespace.
  focusKey?: string;
};

export function useFocusNode(options?: FocusNodeOptions): FocusNodeHandle {
  const id = useId();
  const store = useStore();
  const contextParentId = useContext(ScopeIdContext);

  const parentId = options?.parent?.id ?? contextParentId;
  const focusKey = options?.focusKey;

  const subscribe = useMemo(() => store.subscribe.bind(store), [store]);

  useEffect(() => {
    store.registerNode(id, parentId, focusKey);
    return () => {
      store.unregisterNode(id);
    };
  }, [id, parentId, focusKey, store]);

  const hasFocus = useSyncExternalStore(subscribe, () => store.isFocused(id));

  return { id, hasFocus };
}
