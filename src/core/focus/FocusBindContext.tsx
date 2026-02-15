import { createContext } from 'react';

type FocusBindContextValue = {
  register: (logicalId: string, nodeId: string) => void;
  unregister: (logicalId: string) => void;
};

export const FocusBindContext = createContext<FocusBindContextValue | null>(null);
