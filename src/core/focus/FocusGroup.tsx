import React from 'react';
import { FocusNodeContext } from './FocusContext';
import { useFocus } from './useFocus';

type FocusGroupProps = {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
};

export function FocusGroup({ children, direction = 'vertical' }: FocusGroupProps) {
  const { id } = useFocus();

  return <FocusNodeContext.Provider value={id}>{children}</FocusNodeContext.Provider>;
}
