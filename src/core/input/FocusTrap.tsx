import { useEffect, useRef } from 'react';
import { useFocusNode } from '../focus';
import { FocusNodeContext, useFocusContext } from '../focus/FocusContext';
import { useStore } from '../focus/StoreContext';

type FocusTrapProps = {
  children: React.ReactNode;
};

export function FocusTrap({ children }: FocusTrapProps) {
  const { id } = useFocusNode();
  const store = useStore();
  const { focusFirstChild, getFocusedId, focusNode } = useFocusContext();
  const previousFocusRef = useRef<string | null>(getFocusedId());

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    store.setTrap(id);
    focusFirstChild(id);
    return () => {
      store.clearTrap(id);
      if (previousFocus) {
        focusNode(previousFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return <FocusNodeContext.Provider value={id}>{children}</FocusNodeContext.Provider>;
}
