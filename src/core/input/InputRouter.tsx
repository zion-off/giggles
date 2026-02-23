import React from 'react';
import { useInput } from 'ink';
import { useFocusContext } from '../focus/FocusContext';
import { useStore } from '../focus/StoreContext';
import { normalizeKey } from './normalizeKey';

export function InputRouter({ children }: { children: React.ReactNode }) {
  const store = useStore();
  // Active branch path still comes from the old FocusContext while the focus
  // tree lives there. This will move to store.getActiveBranchPath() in chunk #4
  // when the focus tree itself is migrated.
  const { getFocusedId, getActiveBranchPath } = useFocusContext();

  useInput((input, key) => {
    const focusedId = getFocusedId();
    if (!focusedId) return;

    const path = getActiveBranchPath();
    const trapNodeId = store.getTrapNodeId();

    const keyName = normalizeKey(input, key);
    if (!keyName) return;

    for (const nodeId of path) {
      const nodeBindings = store.getNodeBindings(nodeId);
      if (nodeBindings) {
        // Capture mode: if active and key is not in passthrough, consume immediately
        if (nodeBindings.capture && nodeBindings.onKeypress) {
          if (!nodeBindings.passthrough?.has(keyName)) {
            nodeBindings.onKeypress(input, key);
            return;
          }
        }

        const entry = nodeBindings.bindings.get(keyName);
        if (entry && entry.when !== 'mounted') {
          entry.handler(input, key);
          return;
        }
      }

      if (nodeId === trapNodeId) {
        return;
      }
    }

    // Fall through to mounted bindings (not in the focus path)
    for (const binding of store.getAllBindings()) {
      if (binding.key === keyName && binding.when === 'mounted') {
        binding.handler(input, key);
        return;
      }
    }
  });

  return <>{children}</>;
}
