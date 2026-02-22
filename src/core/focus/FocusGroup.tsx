import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GigglesError } from '../GigglesError';
import { type Keybindings, useKeybindings } from '../input';
import { FocusBindContext } from './FocusBindContext';
import { FocusNodeContext, useFocusContext } from './FocusContext';
import { useFocusNode } from './useFocusNode';

export type FocusGroupHelpers = {
  next: () => void;
  prev: () => void;
  escape: () => void;
};

type FocusGroupProps = {
  children: React.ReactNode;
  value?: string;
  wrap?: boolean;
  keybindings?: Keybindings | ((helpers: FocusGroupHelpers) => Keybindings);
};

export function FocusGroup({ children, value, wrap = true, keybindings: customBindings }: FocusGroupProps) {
  const focus = useFocusNode();
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

  const bindContextValue = useMemo(() => (value ? { register, unregister } : null), [value, register, unregister]);

  const next = useCallback(() => navigateSibling('next', wrap, focus.id), [navigateSibling, wrap, focus.id]);
  const prev = useCallback(() => navigateSibling('prev', wrap, focus.id), [navigateSibling, wrap, focus.id]);
  const escape = useCallback(() => focusNode(focus.id), [focusNode, focus.id]);

  const resolvedBindings = useMemo((): Keybindings => {
    if (typeof customBindings === 'function') {
      return customBindings({ next, prev, escape });
    }
    return customBindings ?? {};
  }, [customBindings, next, prev, escape]);

  useKeybindings(focus, resolvedBindings);

  return (
    <FocusNodeContext.Provider value={focus.id}>
      <FocusBindContext.Provider value={bindContextValue}>{children}</FocusBindContext.Provider>
    </FocusNodeContext.Provider>
  );
}
