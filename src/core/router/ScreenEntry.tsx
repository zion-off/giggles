import React, { useMemo } from 'react';
import { Box } from 'ink';
import { NavigationContext } from './NavigationContext';
import type { NavigationContextValue, ScreenRoute } from './types';

export type ScreenEntryProps = {
  entry: ScreenRoute;
  isTop: boolean;
  canGoBack: boolean;
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
  component: Component,
  push,
  pop,
  replace,
  reset
}: ScreenEntryProps) {
  const value = useMemo<NavigationContextValue>(
    () => ({ currentRoute: entry, active: isTop, canGoBack, push, pop, replace, reset }),
    [entry, isTop, canGoBack, push, pop, replace, reset]
  );

  return (
    <NavigationContext.Provider value={value}>
      <Box display={isTop ? 'flex' : 'none'}>
        <Component {...entry.params} />
      </Box>
    </NavigationContext.Provider>
  );
}
