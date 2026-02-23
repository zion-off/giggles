import { createContext, useContext } from 'react';
import { GigglesError } from '../GigglesError';
import { FocusStore } from './FocusStore';

export const StoreContext = createContext<FocusStore | null>(null);

// Parent scope ID for implicit parent discovery. Set by <FocusScope>.
export const ScopeIdContext = createContext<string | null>(null);

export function useStore(): FocusStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new GigglesError('useStore must be used within a GigglesProvider');
  }
  return store;
}
