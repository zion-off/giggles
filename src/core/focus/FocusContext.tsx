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
  navigateSibling: (direction: 'next' | 'prev', wrap?: boolean, groupId?: string) => void;
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
        let target = parent.childrenIds[0];
        let targetNode = nodes.get(target);
        while (targetNode && targetNode.childrenIds.length > 0) {
          target = targetNode.childrenIds[0];
          targetNode = nodes.get(target);
        }
        focusNode(target);
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
      if (!focusedId) return false;
      const nodes = nodesRef.current;
      let cursor: string | null = focusedId;
      while (cursor) {
        if (cursor === id) return true;
        const node = nodes.get(cursor);
        cursor = node?.parentId ?? null;
      }
      return false;
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
    (direction: 'next' | 'prev', wrap: boolean = true, groupId?: string) => {
      if (!focusedId) return;

      const nodes = nodesRef.current;
      let currentChildId: string | undefined;
      let siblings: string[];

      if (groupId) {
        const group = nodes.get(groupId);
        if (!group || group.childrenIds.length === 0) return;
        siblings = group.childrenIds;

        // Walk up from focusedId to find which direct child of the group contains focus
        let cursor: string | null = focusedId;
        while (cursor) {
          const node = nodes.get(cursor);
          if (node?.parentId === groupId) {
            currentChildId = cursor;
            break;
          }
          cursor = node?.parentId ?? null;
        }
        if (!currentChildId) return;
      } else {
        const currentNode = nodes.get(focusedId);
        if (!currentNode?.parentId) return;

        const parent = nodes.get(currentNode.parentId);
        if (!parent || parent.childrenIds.length === 0) return;
        siblings = parent.childrenIds;
        currentChildId = focusedId;
      }

      const currentIndex = siblings.indexOf(currentChildId);
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

      const targetId = siblings[nextIndex];
      const target = nodes.get(targetId);

      if (target && target.childrenIds.length > 0) {
        focusFirstChild(targetId);
      } else {
        focusNode(targetId);
      }
    },
    [focusedId, focusNode, focusFirstChild]
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
