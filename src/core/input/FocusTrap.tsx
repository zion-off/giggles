import { useEffect } from 'react';
import { useFocus } from '../focus';
import { useInputContext } from './InputContext';

type FocusTrapProps = {
  children: React.ReactNode;
};

export function FocusTrap({ children }: FocusTrapProps) {
  const { id } = useFocus();
  const { setTrap, clearTrap } = useInputContext();

  useEffect(() => {
    setTrap(id);
    return () => clearTrap(id);
  }, [id, setTrap, clearTrap]);

  return <>{children}</>;
}
