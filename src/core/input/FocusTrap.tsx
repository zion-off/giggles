import { useEffect } from 'react';
import { useFocus } from '../focus';
import { useInputContext } from './InputContext';

type FocusTrapProps = {
  children: React.ReactNode;
};

/**
 * Stops input bubbling at a boundary. Used for modals and dialogs.
 *
 * When a key is pressed, it bubbles up the focus tree until handled.
 * FocusTrap creates a barrier - if nothing inside the trap handles the key,
 * it stops at the trap boundary instead of bubbling to parent components.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showModal, setShowModal] = useState(false);
 *
 *   useKeybindings(focus, {
 *     '?': () => setShowModal(true),
 *     q: () => exit()
 *   });
 *
 *   return (
 *     <Screen>
 *       <MainContent />
 *       {showModal && (
 *         <FocusTrap>
 *           <HelpModal onClose={() => setShowModal(false)} />
 *         </FocusTrap>
 *       )}
 *     </Screen>
 *   );
 * }
 * ```
 */
export function FocusTrap({ children }: FocusTrapProps) {
  const { id } = useFocus();
  const { setTrap, clearTrap } = useInputContext();

  useEffect(() => {
    setTrap(id);
    return () => clearTrap(id);
  }, [id, setTrap, clearTrap]);

  return <>{children}</>;
}
