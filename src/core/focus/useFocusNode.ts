import { useContext, useId, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
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

  // Register during render (silent — no subscriber notifications) so that
  // useSyncExternalStore's getSnapshot returns the correct hasFocus value
  // on the first render, avoiding a visible focus jump.
  store.registerNode(id, parentId, focusKey, true);

  // Re-register in the effect setup so that Strict Mode's teardown/re-run
  // cycle restores the node after the cleanup removes it. The early return
  // guard in registerNode makes this a no-op in the normal (non-Strict) case.
  // Flush deferred notifications before paint so already-subscribed
  // components from previous renders see the update.
  useLayoutEffect(() => {
    store.registerNode(id, parentId, focusKey, true);
    store.flush();
    return () => {
      store.unregisterNode(id);
    };
  }, [id, store]);

  const hasFocus = useSyncExternalStore(subscribe, () => store.isFocused(id));

  return { id, hasFocus };
}
