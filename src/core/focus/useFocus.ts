import { useContext, useEffect, useId } from 'react';
import { FocusNodeContext, useFocusContext } from './FocusContext';

export const useFocus = () => {
  const nodeId = useId();
  const parentId = useContext(FocusNodeContext);
  const { focusNode, registerNode, unregisterNode, isFocused } = useFocusContext();

  useEffect(() => {
    registerNode(nodeId, parentId);
    return () => {
      unregisterNode(nodeId);
    };
  }, [nodeId, parentId, registerNode, unregisterNode]);

  return {
    id: nodeId,
    focused: isFocused(nodeId),
    focus: () => focusNode(nodeId)
  };
};
