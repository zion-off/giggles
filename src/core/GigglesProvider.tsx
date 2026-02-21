import React from 'react';
import { AlternateScreen } from '../terminal/components/AlternateScreen';
import { FocusProvider } from './focus';
import { InputProvider, InputRouter } from './input';
import { type GigglesTheme, ThemeProvider } from './theme';

type GigglesProviderProps = {
  theme?: Partial<GigglesTheme>;
  fullScreen?: boolean;
  children: React.ReactNode;
};

export function GigglesProvider({ theme, fullScreen, children }: GigglesProviderProps) {
  return (
    <AlternateScreen fullScreen={fullScreen}>
      <ThemeProvider theme={theme}>
        <FocusProvider>
          <InputProvider>
            <InputRouter>{children}</InputRouter>
          </InputProvider>
        </FocusProvider>
      </ThemeProvider>
    </AlternateScreen>
  );
}
