import { createContext, useCallback, useContext, useRef } from 'react';
import { Key, KeyHandler, KeybindingOptions, Keybindings, RegisteredKeybinding } from './types';

type NodeBindings = {
  bindings: Map<string, KeyHandler>;
  capture: boolean;
  onKeypress?: (input: string, key: Key) => void;
  layer?: string;
};

type InputContextValue = {
  registerKeybindings: (nodeId: string, bindings: Keybindings, options?: KeybindingOptions) => void;
  unregisterKeybindings: (nodeId: string) => void;
  getNodeBindings: (nodeId: string) => NodeBindings | undefined;
  setTrap: (nodeId: string) => void;
  clearTrap: (nodeId: string) => void;
  getTrapNodeId: () => string | null;
  getAllBindings: () => RegisteredKeybinding[];
};

const InputContext = createContext<InputContextValue | null>(null);

export const InputProvider = ({ children }: { children: React.ReactNode }) => {
  const bindingsRef = useRef<Map<string, NodeBindings>>(new Map());
  const trapNodeIdRef = useRef<string | null>(null);

  const registerKeybindings = useCallback((nodeId: string, bindings: Keybindings, options?: KeybindingOptions) => {
    const registration: NodeBindings = {
      bindings: new Map(Object.entries(bindings).filter((entry): entry is [string, KeyHandler] => entry[1] != null)),
      capture: options?.capture ?? false,
      onKeypress: options?.onKeypress,
      layer: options?.layer
    };
    bindingsRef.current.set(nodeId, registration);
  }, []);

  const unregisterKeybindings = useCallback((nodeId: string) => {
    bindingsRef.current.delete(nodeId);
  }, []);

  const getNodeBindings = useCallback((nodeId: string) => {
    return bindingsRef.current.get(nodeId);
  }, []);

  const setTrap = useCallback((nodeId: string) => {
    trapNodeIdRef.current = nodeId;
  }, []);

  const clearTrap = useCallback((nodeId: string | null) => {
    if (trapNodeIdRef.current === nodeId) {
      trapNodeIdRef.current = null;
    }
  }, []);

  const getTrapNodeId = useCallback(() => {
    return trapNodeIdRef.current;
  }, []);

  const getAllBindings = useCallback(() => {
    const allBindings: RegisteredKeybinding[] = [];
    bindingsRef.current.forEach((nodeBindings, nodeId) => {
      nodeBindings.bindings.forEach((handler, key) => {
        allBindings.push({
          nodeId,
          key,
          handler,
          layer: nodeBindings.layer
        });
      });
    });
    return allBindings;
  }, []);

  return (
    <InputContext.Provider
      value={{
        registerKeybindings,
        unregisterKeybindings,
        getNodeBindings,
        setTrap,
        clearTrap,
        getTrapNodeId,
        getAllBindings
      }}
    >
      {children}
    </InputContext.Provider>
  );
};

export function useInputContext() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('useInputContext must be used within an InputProvider');
  }
  return context;
}
