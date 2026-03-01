import React, { useEffect, useRef } from 'react';
import { ScopeIdContext, useStore } from '../focus/StoreContext';
import { useFocusNode } from '../focus/useFocusNode';

type FocusTrapProps = {
  children: React.ReactNode;
};

export function FocusTrap({ children }: FocusTrapProps) {
  const store = useStore();
  const previousFocusRef = useRef<string | null>(store.getFocusedId());
  const { id } = useFocusNode();

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    store.setTrap(id);
    store.focusFirstChild(id);
    return () => {
      store.clearTrap(id);
      if (previousFocus && previousFocus !== id) {
        store.focusNode(previousFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Set ScopeIdContext so child useFocusNode/useFocusScope calls register
  // under the trap node as their parent.
  return <ScopeIdContext.Provider value={id}>{children}</ScopeIdContext.Provider>;
}
