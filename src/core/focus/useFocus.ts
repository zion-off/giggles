import { useContext, useEffect, useId } from 'react';
import { FocusBindContext } from './FocusBindContext';
import { FocusNodeContext, useFocusContext } from './FocusContext';

export const useFocus = (id?: string) => {
  const nodeId = useId();
  const parentId = useContext(FocusNodeContext);
  const bindContext = useContext(FocusBindContext);
  const { focusNode, registerNode, unregisterNode, isFocused } = useFocusContext();

  useEffect(() => {
    registerNode(nodeId, parentId);

    if (id && bindContext) {
      bindContext.register(id, nodeId);
    }

    return () => {
      unregisterNode(nodeId);
      if (id && bindContext) {
        bindContext.unregister(id);
      }
    };
  }, [nodeId, parentId, id, bindContext, registerNode, unregisterNode]);

  return {
    id: nodeId,
    focused: isFocused(nodeId),
    focus: () => focusNode(nodeId)
  };
};
