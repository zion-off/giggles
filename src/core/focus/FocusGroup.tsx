import React, { useCallback, useEffect, useRef } from 'react';
import { FocusBindContext } from './FocusBindContext';
import { FocusNodeContext, useFocusContext } from './FocusContext';
import { useFocus } from './useFocus';

type FocusGroupProps = {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  value?: string;
};

export function FocusGroup({ children, direction = 'vertical', value }: FocusGroupProps) {
  const { id } = useFocus();
  const { focusNode } = useFocusContext();
  const bindMapRef = useRef<Map<string, string>>(new Map());

  const register = useCallback((logicalId: string, nodeId: string) => {
    bindMapRef.current.set(logicalId, nodeId);
  }, []);

  const unregister = useCallback((logicalId: string) => {
    bindMapRef.current.delete(logicalId);
  }, []);

  useEffect(() => {
    if (value) {
      const nodeId = bindMapRef.current.get(value);
      if (nodeId) {
        focusNode(nodeId);
      }
    }
  }, [value, focusNode]);

  const bindContextValue = value ? { register, unregister } : null;

  return (
    <FocusNodeContext.Provider value={id}>
      <FocusBindContext.Provider value={bindContextValue}>{children}</FocusBindContext.Provider>
    </FocusNodeContext.Provider>
  );
}
