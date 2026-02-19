import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { GigglesError } from '../GigglesError';

type FocusNode = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
};

export type FocusContextValue = {
  registerNode: (id: string, parentId: string | null) => void;
  unregisterNode: (id: string) => void;
  focusNode: (id: string) => void;
  focusFirstChild: (parentId: string) => void;
  isFocused: (id: string) => boolean;
  getFocusedId: () => string | null;
  getActiveBranchPath: () => string[];
  navigateSibling: (direction: 'next' | 'prev', wrap?: boolean) => void;
};

export const FocusContext = createContext<FocusContextValue | null>(null);

export const FocusProvider = ({ children }: { children: React.ReactNode }) => {
  const nodesRef = useRef<Map<string, FocusNode>>(new Map());
  const pendingFocusFirstChildRef = useRef<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const focusNode = useCallback((id: string) => {
    const nodes = nodesRef.current;
    if (!nodes.has(id)) return;

    setFocusedId((current) => {
      if (current === id) return current;
      return id;
    });
  }, []);

  const focusFirstChild = useCallback(
    (parentId: string) => {
      const nodes = nodesRef.current;
      const parent = nodes.get(parentId);
      if (parent && parent.childrenIds.length > 0) {
        focusNode(parent.childrenIds[0]);
      } else {
        pendingFocusFirstChildRef.current.add(parentId);
      }
    },
    [focusNode]
  );

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
          const wasEmpty = parent.childrenIds.length === 0;
          parent.childrenIds.push(id);

          if (wasEmpty && pendingFocusFirstChildRef.current.has(parentId)) {
            pendingFocusFirstChildRef.current.delete(parentId);
            focusNode(id);
          }
        }
      }

      nodes.forEach((existingNode) => {
        if (existingNode.parentId === id && !node.childrenIds.includes(existingNode.id)) {
          node.childrenIds.push(existingNode.id);
        }
      });

      if (nodes.size === 1) {
        focusNode(id);
      }
    },
    [focusNode]
  );

  const unregisterNode = useCallback((id: string) => {
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
    pendingFocusFirstChildRef.current.delete(id);

    setFocusedId((current) => {
      if (current !== id) return current;
      return node.parentId ?? null;
    });
  }, []);

  const isFocused = useCallback(
    (id: string) => {
      return id === focusedId;
    },
    [focusedId]
  );

  const getFocusedId = useCallback(() => {
    return focusedId;
  }, [focusedId]);

  const getActiveBranchPath = useCallback(() => {
    if (!focusedId) return [];
    const nodes = nodesRef.current;
    const pathArray: string[] = [];
    let node: string | null = focusedId;
    while (node) {
      pathArray.push(node);
      const n = nodes.get(node);
      node = n?.parentId ?? null;
    }
    return pathArray;
  }, [focusedId]);

  const navigateSibling = useCallback(
    (direction: 'next' | 'prev', wrap: boolean = true) => {
      const currentId = focusedId;
      if (!currentId) return;

      const nodes = nodesRef.current;
      const currentNode = nodes.get(currentId);
      if (!currentNode?.parentId) return;

      const parent = nodes.get(currentNode.parentId);
      if (!parent || parent.childrenIds.length === 0) return;

      const siblings = parent.childrenIds;
      const currentIndex = siblings.indexOf(currentId);
      if (currentIndex === -1) return;

      let nextIndex: number;

      if (wrap) {
        nextIndex =
          direction === 'next'
            ? (currentIndex + 1) % siblings.length
            : (currentIndex - 1 + siblings.length) % siblings.length;
      } else {
        nextIndex =
          direction === 'next' ? Math.min(currentIndex + 1, siblings.length - 1) : Math.max(currentIndex - 1, 0);
      }

      focusNode(siblings[nextIndex]);
    },
    [focusedId, focusNode]
  );

  return (
    <FocusContext.Provider
      value={{
        registerNode,
        unregisterNode,
        focusNode,
        focusFirstChild,
        isFocused,
        getFocusedId,
        getActiveBranchPath,
        navigateSibling
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const FocusNodeContext = createContext<string | null>(null);

export const useFocusContext = () => {
  const context = useContext(FocusContext);

  if (!context) {
    throw new GigglesError('useFocusContext must be used within a FocusProvider');
  }
  return context;
};
