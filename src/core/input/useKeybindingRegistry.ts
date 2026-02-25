import { useStore } from '../focus/StoreContext';
import type { RegisteredKeybinding } from './types';

export type KeybindingRegistry = {
  all: RegisteredKeybinding[];
  available: RegisteredKeybinding[];
  local: RegisteredKeybinding[];
};

export function useKeybindingRegistry(focus?: { id: string }): KeybindingRegistry {
  const store = useStore();

  const all = store.getAllBindings().filter((b) => b.name != null);

  const branchPath = store.getActiveBranchPath();
  const branchSet = new Set(branchPath);

  const trapNodeId = store.getTrapNodeId();
  const withinTrapSet = (() => {
    if (!trapNodeId) return null;
    const trapIndex = branchPath.indexOf(trapNodeId);
    return trapIndex >= 0 ? new Set(branchPath.slice(0, trapIndex + 1)) : null;
  })();

  const available = all.filter((b) => {
    return (withinTrapSet ?? branchSet).has(b.nodeId);
  });

  const local = focus ? all.filter((b) => b.nodeId === focus.id) : [];

  return { all, available, local };
}
