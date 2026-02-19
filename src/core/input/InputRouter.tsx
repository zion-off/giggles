import React from 'react';
import { useInput } from 'ink';
import { useFocusContext } from '../focus/FocusContext';
import { useInputContext } from './InputContext';
import { normalizeKey } from './normalizeKey';

export function InputRouter({ children }: { children: React.ReactNode }) {
  const { getFocusedId, getActiveBranchPath } = useFocusContext();
  const { getNodeBindings, getTrapNodeId, getAllBindings } = useInputContext();

  useInput((input, key) => {
    const focusedId = getFocusedId();
    if (!focusedId) return;

    const path = getActiveBranchPath();
    const trapNodeId = getTrapNodeId();

    const keyName = normalizeKey(input, key);
    if (!keyName) return;

    for (const nodeId of path) {
      const nodeBindings = getNodeBindings(nodeId);
      if (!nodeBindings) continue;

      const entry = nodeBindings.bindings.get(keyName);
      if (entry && entry.when !== 'mounted') {
        entry.handler(input, key);
        return;
      }

      if (nodeBindings.capture && nodeBindings.onKeypress) {
        if (nodeBindings.passthrough?.has(keyName)) {
          continue;
        }
        nodeBindings.onKeypress(input, key);
        return;
      }

      if (nodeId === trapNodeId) {
        return;
      }
    }

    // Fall through to mounted bindings (not in the focus path)
    for (const binding of getAllBindings()) {
      if (binding.key === keyName && binding.when === 'mounted') {
        binding.handler(input, key);
        return;
      }
    }
  });

  return <>{children}</>;
}
