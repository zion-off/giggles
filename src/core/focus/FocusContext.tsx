import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type FocusNode = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
};

export type FocusContextValue = {
  registerNode: (id: string, parentId: string | null) => void;
  unregisterNode: (id: string) => void;
  focusNode: (id: string) => void;
  isFocused: (id: string) => boolean;
  isInActiveBranch: (id: string) => boolean;
  getFocusedId: () => string | null;
};

export const FocusContext = createContext<FocusContextValue | null>(null);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const nodesRef = useRef<Map<string, FocusNode>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [activeBranchNodes, setActiveBranchNodes] = useState<Set<string>>(new Set());

  const focusNode = useCallback((id: string) => {
    const nodes = nodesRef.current;
    if (!nodes.has(id)) return;

    setFocusedId((current) => {
      if (current === id) return current;
      const path = new Set<string>();
      let currentNode: string | null = id;
      while (currentNode) {
        path.add(currentNode);
        const node = nodes.get(currentNode);
        currentNode = node?.parentId ?? null;
      }
      setActiveBranchNodes(path);
      return id;
    });
  }, []);

  const registerNode = useCallback(
    (id: string, parentId: string | null) => {
      const nodes = nodesRef.current;

      const node: FocusNode = {
        id,
        parentId,
        childrenIds: []
      };

      nodes.set(id, node);

      if (parentId) {
        const parent = nodes.get(parentId);
        if (parent && !parent.childrenIds.includes(id)) {
          parent.childrenIds.push(id);
        }
      }

      if (nodes.size === 1) {
        focusNode(id);
      }
    },
    [focusNode]
  );

  const unregisterNode = useCallback(
    (id: string) => {
      const nodes = nodesRef.current;
      const node = nodes.get(id);

      if (!node) return;
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent) {
          parent.childrenIds = parent.childrenIds.filter((childId) => childId !== id);
        }
      }
      nodes.delete(id);

      if (focusedId === id) {
        if (node.parentId) {
          focusNode(node.parentId);
        } else {
          setFocusedId(null);
          setActiveBranchNodes(new Set());
        }
      }
    },
    [focusedId, focusNode]
  );

  const isFocused = useCallback(
    (id: string) => {
      return id === focusedId;
    },
    [focusedId]
  );

  const isInActiveBranch = useCallback(
    (id: string) => {
      return activeBranchNodes.has(id);
    },
    [activeBranchNodes]
  );

  const getFocusedId = useCallback(() => {
    return focusedId;
  }, [focusedId]);

  return (
    <FocusContext.Provider
      value={{ registerNode, unregisterNode, focusNode, isFocused, isInActiveBranch, getFocusedId }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const FocusNodeContext = createContext<string | null>(null);

export const useFocusContext = () => {
  const context = useContext(FocusContext);

  if (!context) {
    throw new Error('useFocusContext must be used within a FocusProvider');
  }
  return context;
};
