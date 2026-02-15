import { createContext, useContext } from 'react';
import { GigglesError } from '../GigglesError';
import { NavigationContextValue } from './types';

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new GigglesError('useNavigation must be used within a Router');
  }
  return context;
};
