import React from 'react';
import { FocusProvider } from './focus';
import { InputProvider, InputRouter } from './input';

type GigglesProviderProps = {
  children: React.ReactNode;
};

/**
 * Root provider for Giggles applications. Combines focus and input systems.
 *
 * Wraps your app in the necessary context providers and sets up the input router.
 * All Giggles apps must be wrapped in this provider.
 *
 * @example
 * ```tsx
 * import { render } from 'ink';
 * import { GigglesProvider } from 'giggles';
 * import { App } from './App';
 *
 * render(
 *   <GigglesProvider>
 *     <App />
 *   </GigglesProvider>
 * );
 * ```
 */
export function GigglesProvider({ children }: GigglesProviderProps) {
  return (
    <FocusProvider>
      <InputProvider>
        <InputRouter>{children}</InputRouter>
      </InputProvider>
    </FocusProvider>
  );
}
