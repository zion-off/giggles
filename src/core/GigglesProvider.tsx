import React from 'react';
import { FocusProvider } from './focus';
import { InputProvider, InputRouter } from './input';

type GigglesProviderProps = {
  children: React.ReactNode;
};

export function GigglesProvider({ children }: GigglesProviderProps) {
  return (
    <FocusProvider>
      <InputProvider>
        <InputRouter>{children}</InputRouter>
      </InputProvider>
    </FocusProvider>
  );
}
