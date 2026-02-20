import React from 'react';
import { AlternateScreen } from '../terminal/components/AlternateScreen';
import { FocusProvider } from './focus';
import { InputProvider, InputRouter } from './input';
import { type GigglesTheme, ThemeProvider } from './theme';

type GigglesProviderProps = {
  theme?: Partial<GigglesTheme>;
  children: React.ReactNode;
};

export function GigglesProvider({ theme, children }: GigglesProviderProps) {
  return (
    <AlternateScreen>
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
