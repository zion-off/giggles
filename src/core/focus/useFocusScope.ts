import { useContext, useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { ScopeIdContext, useStore } from './StoreContext';

export type FocusScopeHandle = {
  id: string;
  hasFocus: boolean;
  isPassive: boolean;
};

export type FocusScopeOptions = {
  // Explicit parent — use when creating a scope in the same component as its parent,
  // bypassing ScopeIdContext. If omitted, the parent is read from ScopeIdContext.
  parent?: FocusScopeHandle;
};

export function useFocusScope(options?: FocusScopeOptions): FocusScopeHandle {
  const id = useId();
  const store = useStore();
  const contextParentId = useContext(ScopeIdContext);

  // Explicit parent takes precedence over context.
  const parentId = options?.parent?.id ?? contextParentId;

  // Stable subscribe reference for useSyncExternalStore.
  // store is stable (created once in GigglesProvider), so this never changes.
  const subscribe = useMemo(() => store.subscribe.bind(store), [store]);

  // Node registration happens in useEffect (fires bottom-up: children before parents).
  // The reverse-scan in FocusStore.registerNode handles the case where a child
  // registers before its parent scope exists in the tree.
  useEffect(() => {
    store.registerNode(id, parentId);
    return () => {
      store.unregisterNode(id);
    };
  }, [id, parentId, store]);

  // Reactive reads via useSyncExternalStore. Each subscription returns a primitive
  // (boolean), so Object.is comparison avoids unnecessary re-renders.
  const hasFocus = useSyncExternalStore(subscribe, () => store.isFocused(id));
  const isPassive = useSyncExternalStore(subscribe, () => store.isPassive(id));

  return { id, hasFocus, isPassive };
}
