import { useCallback, useContext, useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { GigglesError } from '../GigglesError';
import type { Keybindings } from '../input/types';
import { ScopeIdContext, useStore } from './StoreContext';

export type FocusScopeHandle = {
  id: string;
  hasFocus: boolean;
  isPassive: boolean;
  next: () => void;
  prev: () => void;
  nextShallow: () => void;
  prevShallow: () => void;
  escape: () => void;
  drillIn: () => void;
};

// Subset of FocusScopeHandle — the navigation helpers passed to the keybindings factory.
export type FocusScopeHelpers = Pick<
  FocusScopeHandle,
  'next' | 'prev' | 'nextShallow' | 'prevShallow' | 'escape' | 'drillIn'
>;

export type FocusScopeOptions = {
  // Explicit parent — use when creating a scope in the same component as its parent,
  // bypassing ScopeIdContext. If omitted, the parent is read from ScopeIdContext.
  parent?: FocusScopeHandle;
  // Keybindings for this scope. Pass a plain object or a callback that receives
  // navigation helpers and returns a plain object. Handlers are fresh every render
  // (closures are never stale).
  keybindings?: Keybindings | ((helpers: FocusScopeHelpers) => Keybindings);
};

export function useFocusScope(options?: FocusScopeOptions): FocusScopeHandle {
  const id = useId();
  const keybindingRegistrationId = useId();
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

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  // id and store are both stable, so these callbacks never change reference.

  const next = useCallback(() => store.navigateSibling('next', true, id), [store, id]);
  const prev = useCallback(() => store.navigateSibling('prev', true, id), [store, id]);
  const nextShallow = useCallback(() => store.navigateSibling('next', true, id, true), [store, id]);
  const prevShallow = useCallback(() => store.navigateSibling('prev', true, id, true), [store, id]);
  // escape: focus this scope's own node and mark it passive so parent bindings take over.
  const escape = useCallback(() => store.makePassive(id), [store, id]);
  // drillIn: focus the deepest first child of this scope, clearing any passive state.
  const drillIn = useCallback(() => store.focusFirstChild(id), [store, id]);

  // ---------------------------------------------------------------------------
  // Keybinding registration (synchronous during render — closures are always fresh)
  // ---------------------------------------------------------------------------

  const resolvedBindings: Keybindings =
    typeof options?.keybindings === 'function'
      ? options.keybindings({ next, prev, nextShallow, prevShallow, escape, drillIn })
      : options?.keybindings ?? {};

  // Register synchronously so the bindings are always ready for the next keypress.
  // The registrationId is stable, so each render replaces the previous registration
  // for this scope in place.
  store.registerKeybindings(id, keybindingRegistrationId, resolvedBindings);

  useEffect(() => {
    return () => {
      store.unregisterKeybindings(id, keybindingRegistrationId);
    };
  }, [id, keybindingRegistrationId, store]);

  useEffect(() => {
    if (!store.hasFocusScopeComponent(id)) {
      throw new GigglesError(
        'useFocusScope() was called but no <FocusScope handle={scope}> was rendered. ' +
          'Every useFocusScope() call requires a corresponding <FocusScope> in the render output — ' +
          'without it, child components register under the wrong parent scope and keyboard navigation silently breaks.'
      );
    }
  }, [id, store]);

  return { id, hasFocus, isPassive, next, prev, nextShallow, prevShallow, escape, drillIn };
}
