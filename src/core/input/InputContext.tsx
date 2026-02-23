import { createContext, useCallback, useContext, useRef } from 'react';
import { GigglesError } from '../GigglesError';
import { Key, KeyHandler, KeybindingOptions, Keybindings, RegisteredKeybinding } from './types';

type BindingEntry = {
  handler: KeyHandler;
  name?: string;
  when?: 'focused' | 'mounted';
};

type NodeBindings = {
  bindings: Map<string, BindingEntry>;
  capture: boolean;
  onKeypress?: (input: string, key: Key) => void;
  passthrough?: Set<string>;
  layer?: string;
};

type BindingRegistration = {
  bindings: Map<string, BindingEntry>;
  capture: boolean;
  onKeypress?: (input: string, key: Key) => void;
  passthrough?: Set<string>;
  layer?: string;
};

type InputContextValue = {
  registerKeybindings: (
    nodeId: string,
    registrationId: string,
    bindings: Keybindings,
    options?: KeybindingOptions
  ) => void;
  unregisterKeybindings: (nodeId: string, registrationId: string) => void;
  getNodeBindings: (nodeId: string) => NodeBindings | undefined;
  setTrap: (nodeId: string) => void;
  clearTrap: (nodeId: string) => void;
  getTrapNodeId: () => string | null;
  getAllBindings: () => RegisteredKeybinding[];
};

const InputContext = createContext<InputContextValue | null>(null);

export const InputProvider = ({ children }: { children: React.ReactNode }) => {
  // Map of nodeId -> Map of registrationId -> BindingRegistration
  const bindingsRef = useRef<Map<string, Map<string, BindingRegistration>>>(new Map());
  const trapNodeIdRef = useRef<string | null>(null);

  const registerKeybindings = useCallback(
    (nodeId: string, registrationId: string, bindings: Keybindings, options?: KeybindingOptions) => {
      const entries: [string, BindingEntry][] = Object.entries(bindings)
        .filter((entry): entry is [string, NonNullable<(typeof bindings)[string]>] => entry[1] != null)
        .map(([key, def]) => {
          if (typeof def === 'function') {
            return [key, { handler: def }];
          }
          return [key, { handler: def.action, name: def.name, when: def.when }];
        });

      const registration: BindingRegistration = {
        bindings: new Map(entries),
        capture: options?.capture ?? false,
        onKeypress: options?.onKeypress,
        passthrough: options?.passthrough ? new Set(options.passthrough) : undefined,
        layer: options?.layer
      };

      if (!bindingsRef.current.has(nodeId)) {
        bindingsRef.current.set(nodeId, new Map());
      }
      bindingsRef.current.get(nodeId)!.set(registrationId, registration);
    },
    []
  );

  const unregisterKeybindings = useCallback((nodeId: string, registrationId: string) => {
    const nodeRegistrations = bindingsRef.current.get(nodeId);
    if (nodeRegistrations) {
      nodeRegistrations.delete(registrationId);
      if (nodeRegistrations.size === 0) {
        bindingsRef.current.delete(nodeId);
      }
    }
  }, []);

  const getNodeBindings = useCallback((nodeId: string): NodeBindings | undefined => {
    const nodeRegistrations = bindingsRef.current.get(nodeId);
    if (!nodeRegistrations || nodeRegistrations.size === 0) {
      return undefined;
    }

    // Merge all registrations for this node
    const mergedBindings = new Map<string, BindingEntry>();
    let finalCapture = false;
    let finalOnKeypress: ((input: string, key: Key) => void) | undefined;
    let finalPassthrough: Set<string> | undefined;
    let finalLayer: string | undefined;

    // Iterate in insertion order - later registrations override earlier ones
    for (const registration of nodeRegistrations.values()) {
      // For registrations with capture mode (identified by having onKeypress):
      // - Only include their bindings when capture is active
      // - When capture is inactive, skip their bindings entirely
      const isCaptureRegistration = registration.onKeypress !== undefined;
      const shouldIncludeBindings = !isCaptureRegistration || registration.capture;

      if (shouldIncludeBindings) {
        // Merge bindings - later keys override earlier ones
        for (const [key, entry] of registration.bindings) {
          mergedBindings.set(key, entry);
        }
      }

      // For capture mode: if any registration has capture, use the last one's settings
      if (registration.capture) {
        finalCapture = true;
        finalOnKeypress = registration.onKeypress;
        finalPassthrough = registration.passthrough;
      }

      // Layer from last registration
      if (registration.layer) {
        finalLayer = registration.layer;
      }
    }

    return {
      bindings: mergedBindings,
      capture: finalCapture,
      onKeypress: finalOnKeypress,
      passthrough: finalPassthrough,
      layer: finalLayer
    };
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
    bindingsRef.current.forEach((nodeRegistrations, nodeId) => {
      nodeRegistrations.forEach((registration) => {
        registration.bindings.forEach((entry, key) => {
          allBindings.push({
            nodeId,
            key,
            handler: entry.handler,
            name: entry.name,
            when: entry.when,
            layer: registration.layer
          });
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
    throw new GigglesError('useInputContext must be used within an InputProvider');
  }
  return context;
}
