import { useContext } from 'react';
import { FocusNodeContext, useFocusContext } from './FocusContext';
import type { FocusHandle } from './types';

export const useFocus = (): FocusHandle => {
  const parentId = useContext(FocusNodeContext);
  const { focusNode, isFocused } = useFocusContext();

  if (parentId === null) {
    return { id: '', focused: false, focus: () => {} };
  }

  return {
    id: parentId,
    focused: isFocused(parentId),
    focus: () => focusNode(parentId)
  };
};
