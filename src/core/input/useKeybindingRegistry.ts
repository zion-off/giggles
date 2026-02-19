import type { FocusHandle } from '../focus';
import { useFocusContext } from '../focus/FocusContext';
import { useInputContext } from './InputContext';
import type { RegisteredKeybinding } from './types';

export type KeybindingRegistry = {
  all: RegisteredKeybinding[];
  available: RegisteredKeybinding[];
  local: RegisteredKeybinding[];
};

export function useKeybindingRegistry(focus?: FocusHandle): KeybindingRegistry {
  const { getAllBindings } = useInputContext();
  const { getActiveBranchPath } = useFocusContext();

  const all = getAllBindings().filter((b) => b.name != null);

  const branchPath = getActiveBranchPath();
  const branchSet = new Set(branchPath);

  const available = all.filter((b) => {
    if (b.when === 'mounted') return true;
    return branchSet.has(b.nodeId);
  });

  const local = focus ? all.filter((b) => b.nodeId === focus.id) : [];

  return { all, available, local };
}
