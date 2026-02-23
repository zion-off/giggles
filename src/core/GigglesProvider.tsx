import React, { useRef } from 'react';
import { AlternateScreen } from '../terminal/components/AlternateScreen';
import { FocusStore } from './focus/FocusStore';
import { StoreContext } from './focus/StoreContext';
import { InputRouter } from './input';
import { type GigglesTheme, ThemeProvider } from './theme';

type GigglesProviderProps = {
  theme?: Partial<GigglesTheme>;
  fullScreen?: boolean;
  children: React.ReactNode;
};

export function GigglesProvider({ theme, fullScreen, children }: GigglesProviderProps) {
  const storeRef = useRef<FocusStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new FocusStore();
  }

  return (
    <AlternateScreen fullScreen={fullScreen}>
      <ThemeProvider theme={theme}>
        <StoreContext.Provider value={storeRef.current}>
          <InputRouter>{children}</InputRouter>
        </StoreContext.Provider>
      </ThemeProvider>
    </AlternateScreen>
  );
}
