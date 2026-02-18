import React from 'react';
import { AlternateScreen } from '../terminal/components/AlternateScreen';
import { FocusProvider } from './focus';
import { InputProvider, InputRouter } from './input';

type GigglesProviderProps = {
  children: React.ReactNode;
};

export function GigglesProvider({ children }: GigglesProviderProps) {
  return (
    <AlternateScreen>
      <FocusProvider>
        <InputProvider>
          <InputRouter>{children}</InputRouter>
        </InputProvider>
      </FocusProvider>
    </AlternateScreen>
  );
}
