import { createContext, useContext } from 'react';

type FocusBindContextValue = {
  register: (logicalId: string, nodeId: string) => void;
  unregister: (logicalId: string) => void;
};

export const FocusBindContext = createContext<FocusBindContextValue | null>(null);

export function useFocusBind() {
  const context = useContext(FocusBindContext);
  if (!context) {
    throw new Error('useFocusBind must be used within a FocusBindProvider');
  }
  return context;
}
