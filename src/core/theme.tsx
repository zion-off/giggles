import React, { createContext, useContext } from 'react';

export type GigglesTheme = {
  accentColor: string;
  selectedColor: string;
  indicator: string;
  checkedIndicator: string;
  uncheckedIndicator: string;
};

const defaultTheme: GigglesTheme = {
  accentColor: '#6B9FD4',
  selectedColor: '#8FBF7F',
  indicator: '▸',
  checkedIndicator: '✓',
  uncheckedIndicator: '○'
};

const ThemeContext = createContext<GigglesTheme>(defaultTheme);

type ThemeProviderProps = {
  theme?: Partial<GigglesTheme>;
  children: React.ReactNode;
};

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const parent = useContext(ThemeContext);
  const merged = { ...parent, ...theme };

  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>;
}

export function useTheme(): GigglesTheme {
  return useContext(ThemeContext);
}
