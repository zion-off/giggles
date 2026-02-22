import { useEffect, useRef } from 'react';
import { useFocusNode } from '../focus';
import { FocusNodeContext, useFocusContext } from '../focus/FocusContext';
import { useInputContext } from './InputContext';

type FocusTrapProps = {
  children: React.ReactNode;
};

export function FocusTrap({ children }: FocusTrapProps) {
  const { id } = useFocusNode();
  const { setTrap, clearTrap } = useInputContext();
  const { focusFirstChild, getFocusedId, focusNode } = useFocusContext();
  const previousFocusRef = useRef<string | null>(getFocusedId());

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    setTrap(id);
    focusFirstChild(id);
    return () => {
      clearTrap(id);
      if (previousFocus) {
        focusNode(previousFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return <FocusNodeContext.Provider value={id}>{children}</FocusNodeContext.Provider>;
}
