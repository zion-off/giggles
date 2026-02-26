import { useSyncExternalStore } from 'react';
import { useStore } from '../focus/StoreContext';
import type { RegisteredKeybinding } from './types';

export type KeybindingRegistry = {
  all: RegisteredKeybinding[];
  available: RegisteredKeybinding[];
  local: RegisteredKeybinding[];
};

export function useKeybindingRegistry(focus?: { id: string }): KeybindingRegistry {
  const store = useStore();

  // Subscribe to store mutations so the registry re-renders on focus/node changes
  useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getVersion()
  );

  const all = store.getAllBindings().filter((b) => b.name != null);

  const branchPath = store.getActiveBranchPath();
  const branchSet = new Set(branchPath);

  const trapNodeId = store.getTrapNodeId();
  const withinTrapSet = (() => {
    if (!trapNodeId) return null;
    const trapIndex = branchPath.indexOf(trapNodeId);
    return trapIndex >= 0 ? new Set(branchPath.slice(0, trapIndex + 1)) : null;
  })();

  // Collect bindings on the active branch, deduplicating by key.
  // branchPath is ordered focused → root, matching dispatch priority,
  // so the first binding for a given key is the one that would actually fire.
  const availableSet = withinTrapSet ?? branchSet;
  const seenKeys = new Set<string>();
  const available: RegisteredKeybinding[] = [];
  for (const nodeId of branchPath) {
    if (!availableSet.has(nodeId)) continue;
    for (const b of all) {
      if (b.nodeId === nodeId && !seenKeys.has(b.key)) {
        seenKeys.add(b.key);
        available.push(b);
      }
    }
  }

  const local = focus ? all.filter((b) => b.nodeId === focus.id) : [];

  return { all, available, local };
}
