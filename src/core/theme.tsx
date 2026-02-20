import React, { createContext, useContext } from 'react';

export type GigglesTheme = {
  accentColor: string;
  selectedColor: string;
  hintColor: string;
  hintDimColor: string;
  hintHighlightColor: string;
  hintHighlightDimColor: string;
  indicator: string;
  checkedIndicator: string;
  uncheckedIndicator: string;
};

const defaultTheme: GigglesTheme = {
  accentColor: '#6B9FD4',
  selectedColor: '#8FBF7F',
  hintColor: '#8A8A8A',
  hintDimColor: '#5C5C5C',
  hintHighlightColor: '#D4D4D4',
  hintHighlightDimColor: '#A0A0A0',
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
