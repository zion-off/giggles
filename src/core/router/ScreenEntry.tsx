import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Box } from 'ink';
import { FocusNodeContext, useFocusContext } from '../focus';
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
  const screenNodeId = useId();
  const parentId = React.useContext(FocusNodeContext);
  const { registerNode, unregisterNode, focusFirstChild, focusNode, getFocusedId } = useFocusContext();
  const lastFocusedChildRef = useRef<string | null>(null);
  const wasTopRef = useRef(isTop);

  useEffect(() => {
    registerNode(screenNodeId, parentId);
    return () => {
      unregisterNode(screenNodeId);
    };
  }, [screenNodeId, parentId, registerNode, unregisterNode]);

  useEffect(() => {
    if (!wasTopRef.current && isTop) {
      const saved = restoreFocus ? lastFocusedChildRef.current : null;
      if (saved) {
        focusNode(saved);
      } else {
        focusFirstChild(screenNodeId);
      }
    } else if (wasTopRef.current && !isTop) {
      lastFocusedChildRef.current = getFocusedId();
    } else if (isTop) {
      focusFirstChild(screenNodeId);
    }
    wasTopRef.current = isTop;
  }, [isTop, screenNodeId, focusFirstChild, focusNode, getFocusedId]);

  const value = useMemo<NavigationContextValue>(
    () => ({ currentRoute: entry, active: isTop, canGoBack, push, pop, replace, reset }),
    [entry, isTop, canGoBack, push, pop, replace, reset]
  );

  return (
    <NavigationContext.Provider value={value}>
      <FocusNodeContext.Provider value={screenNodeId}>
        <Box display={isTop ? 'flex' : 'none'}>
          <Component {...entry.params} />
        </Box>
      </FocusNodeContext.Provider>
    </NavigationContext.Provider>
  );
}
