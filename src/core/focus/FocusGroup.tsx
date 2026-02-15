import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GigglesError } from '../GigglesError';
import { type Keybindings, useKeybindings } from '../input';
import { FocusBindContext } from './FocusBindContext';
import { FocusNodeContext, useFocusContext } from './FocusContext';
import { useFocus } from './useFocus';

type FocusGroupProps = {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  value?: string;
  wrap?: boolean;
  navigable?: boolean;
};

export function FocusGroup({
  children,
  direction = 'vertical',
  value,
  wrap = true,
  navigable = true
}: FocusGroupProps) {
  const focus = useFocus();
  const { focusNode, navigateSibling } = useFocusContext();
  const bindMapRef = useRef<Map<string, string>>(new Map());

  const register = useCallback((logicalId: string, nodeId: string) => {
    if (bindMapRef.current.has(logicalId)) {
      throw new GigglesError(`FocusGroup: Duplicate id "${logicalId}". Each child must have a unique id.`);
    }
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

  const navigationKeys = useMemo((): Keybindings => {
    if (!navigable) return {};

    const next = () => navigateSibling('next', wrap);
    const prev = () => navigateSibling('prev', wrap);

    return direction === 'vertical'
      ? {
          j: next,
          k: prev,
          down: next,
          up: prev
        }
      : {
          l: next,
          h: prev,
          right: next,
          left: prev
        };
  }, [navigable, direction, wrap, navigateSibling]);

  useKeybindings(focus, navigationKeys);

  return (
    <FocusNodeContext.Provider value={focus.id}>
      <FocusBindContext.Provider value={bindContextValue}>{children}</FocusBindContext.Provider>
    </FocusNodeContext.Provider>
  );
}
