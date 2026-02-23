import React, { useRef } from 'react';
import { AlternateScreen } from '../terminal/components/AlternateScreen';
import { FocusProvider } from './focus';
import { FocusStore } from './focus/FocusStore';
import { StoreContext } from './focus/StoreContext';
import { InputProvider, InputRouter } from './input';
import { type GigglesTheme, ThemeProvider } from './theme';

type GigglesProviderProps = {
  theme?: Partial<GigglesTheme>;
  fullScreen?: boolean;
  children: React.ReactNode;
};

export function GigglesProvider({ theme, fullScreen, children }: GigglesProviderProps) {
  // Create the FocusStore once per provider tree. useRef with lazy init ensures
  // a single instance that survives re-renders without triggering new renders itself.
  const storeRef = useRef<FocusStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new FocusStore();
  }

  return (
    <AlternateScreen fullScreen={fullScreen}>
      <ThemeProvider theme={theme}>
        <StoreContext.Provider value={storeRef.current}>
          <FocusProvider>
            <InputProvider>
              <InputRouter>{children}</InputRouter>
            </InputProvider>
          </FocusProvider>
        </StoreContext.Provider>
      </ThemeProvider>
    </AlternateScreen>
  );
}
