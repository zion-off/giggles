import React from 'react';
import { useInput } from 'ink';
import { useFocusContext } from '../focus/FocusContext';
import { useInputContext } from './InputContext';
import { normalizeKey } from './normalizeKey';

export function InputRouter({ children }: { children: React.ReactNode }) {
  const { getFocusedId, getActiveBranchPath } = useFocusContext();
  const { getNodeBindings, getTrapNodeId } = useInputContext();

  useInput((input, key) => {
    const focusedId = getFocusedId();
    if (!focusedId) return;

    const path = getActiveBranchPath();
    const trapNodeId = getTrapNodeId();

    const keyName = normalizeKey(input, key);

    for (const nodeId of path) {
      const nodeBindings = getNodeBindings(nodeId);
      if (!nodeBindings) continue;

      const handler = nodeBindings.bindings.get(keyName);
      if (handler) {
        handler(input, key);
        return;
      }

      if (nodeBindings.capture && nodeBindings.onKeypress) {
        nodeBindings.onKeypress(input, key);
        return;
      }

      if (nodeId === trapNodeId) {
        return;
      }
    }
  });

  return <>{children}</>;
}
