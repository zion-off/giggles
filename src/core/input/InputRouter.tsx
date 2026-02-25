import React from 'react';
import { useInput } from 'ink';
import { useStore } from '../focus/StoreContext';

// Bridges Ink's useInput to store.dispatch. All dispatch logic (passive-scope
// skipping, fallback handlers, trap boundary) now lives in the store.
export function InputRouter({ children }: { children: React.ReactNode }) {
  const store = useStore();

  useInput((input, key) => {
    store.dispatch(input, key);
  });

  return <>{children}</>;
}
