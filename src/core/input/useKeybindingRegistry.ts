import type { FocusHandle } from '../focus';
import { useFocusContext } from '../focus/FocusContext';
import { useStore } from '../focus/StoreContext';
import type { RegisteredKeybinding } from './types';

export type KeybindingRegistry = {
  all: RegisteredKeybinding[];
  available: RegisteredKeybinding[];
  local: RegisteredKeybinding[];
};

export function useKeybindingRegistry(focus?: FocusHandle): KeybindingRegistry {
  const store = useStore();
  // Active branch path still comes from the old FocusContext while the focus
  // tree lives there. This will move to store.getActiveBranchPath() in chunk #4.
  const { getActiveBranchPath } = useFocusContext();

  const all = store.getAllBindings().filter((b) => b.name != null);

  const branchPath = getActiveBranchPath();
  const branchSet = new Set(branchPath);

  const trapNodeId = store.getTrapNodeId();
  const withinTrapSet = (() => {
    if (!trapNodeId) return null;
    const trapIndex = branchPath.indexOf(trapNodeId);
    return trapIndex >= 0 ? new Set(branchPath.slice(0, trapIndex + 1)) : null;
  })();

  const available = all.filter((b) => {
    if (b.when === 'mounted') return withinTrapSet ? withinTrapSet.has(b.nodeId) : true;
    return (withinTrapSet ?? branchSet).has(b.nodeId);
  });

  const local = focus ? all.filter((b) => b.nodeId === focus.id) : [];

  return { all, available, local };
}
