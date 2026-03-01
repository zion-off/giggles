import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Box } from 'ink';
import { ScopeIdContext, useStore } from '../focus/StoreContext';
import { useFocusNode } from '../focus/useFocusNode';
import { NavigationContext } from './NavigationContext';
import type { NavigationContextValue, ScreenRoute } from './types';

export type ScreenEntryProps = {
  entry: ScreenRoute;
  isTop: boolean;
  canGoBack: boolean;
  restoreFocus: boolean;
  component: React.ComponentType<Record<string, unknown>>;
  push: NavigationContextValue['push'];
  pop: NavigationContextValue['pop'];
  replace: NavigationContextValue['replace'];
  reset: NavigationContextValue['reset'];
};

export function ScreenEntry({
  entry,
  isTop,
  canGoBack,
  restoreFocus,
  component: Component,
  push,
  pop,
  replace,
  reset
}: ScreenEntryProps) {
  const { id: screenNodeId } = useFocusNode();
  const store = useStore();
  const lastFocusedChildRef = useRef<string | null>(null);
  const wasTopRef = useRef(isTop);

  useLayoutEffect(() => {
    if (!wasTopRef.current && isTop) {
      const saved = restoreFocus ? lastFocusedChildRef.current : null;
      if (saved) {
        store.focusNode(saved);
      } else {
        store.focusFirstChild(screenNodeId);
      }
    } else if (wasTopRef.current && !isTop) {
      lastFocusedChildRef.current = store.getFocusedId();
    } else if (isTop) {
      store.focusFirstChild(screenNodeId);
    }
    wasTopRef.current = isTop;
  }, [isTop, screenNodeId, restoreFocus, store]);

  const value = useMemo<NavigationContextValue>(
    () => ({ currentRoute: entry, active: isTop, canGoBack, push, pop, replace, reset }),
    [entry, isTop, canGoBack, push, pop, replace, reset]
  );

  return (
    <NavigationContext.Provider value={value}>
      <ScopeIdContext.Provider value={screenNodeId}>
        <Box display={isTop ? 'flex' : 'none'}>
          <Component {...entry.params} />
        </Box>
      </ScopeIdContext.Provider>
    </NavigationContext.Provider>
  );
}
