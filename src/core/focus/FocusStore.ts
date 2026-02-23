import type { Key, KeyHandler, KeybindingOptions, Keybindings, RegisteredKeybinding } from '../input/types';

type FocusNode = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
};

type BindingEntry = {
  handler: KeyHandler;
  name?: string;
  when?: 'focused' | 'mounted';
};

type BindingRegistration = {
  bindings: Map<string, BindingEntry>;
  capture: boolean;
  onKeypress?: (input: string, key: Key) => void;
  passthrough?: Set<string>;
  layer?: string;
};

export type NodeBindings = {
  bindings: Map<string, BindingEntry>;
  capture: boolean;
  onKeypress?: (input: string, key: Key) => void;
  passthrough?: Set<string>;
  layer?: string;
};

export class FocusStore {
  private nodes: Map<string, FocusNode> = new Map();
  // Persistent parent record — never deleted from, used for ancestor-walk during unregistration
  private parentMap: Map<string, string | null> = new Map();
  private focusedId: string | null = null;
  private passiveSet: Set<string> = new Set();
  private pendingFocusFirstChild: Set<string> = new Set();
  private trapNodeId: string | null = null;
  private listeners: Set<() => void> = new Set();
  // nodeId → registrationId → BindingRegistration
  // Keybindings register synchronously during render; nodes register in useEffect.
  // A keybinding may exist for a node that has not yet appeared in the node tree —
  // this is safe because dispatch only walks nodes in the active branch path.
  private keybindings: Map<string, Map<string, BindingRegistration>> = new Map();

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  registerNode(id: string, parentId: string | null): void {
    const node: FocusNode = { id, parentId, childrenIds: [] };
    this.nodes.set(id, node);
    this.parentMap.set(id, parentId);

    // Link to parent if it exists already
    if (parentId) {
      const parent = this.nodes.get(parentId);
      if (parent && !parent.childrenIds.includes(id)) {
        const wasEmpty = parent.childrenIds.length === 0;
        parent.childrenIds.push(id);

        // Fulfill a pending focusFirstChild request on the parent
        if (wasEmpty && this.pendingFocusFirstChild.has(parentId)) {
          this.pendingFocusFirstChild.delete(parentId);
          this.focusNode(id);
        }
      }
    }

    // Reverse-scan: adopt orphaned children that registered before us (children
    // register before parents due to React's bottom-up effect ordering)
    for (const [existingId, existingNode] of this.nodes) {
      if (existingNode.parentId === id && !node.childrenIds.includes(existingId)) {
        node.childrenIds.push(existingId);
      }
    }

    // Auto-focus the very first node added to the tree
    if (this.nodes.size === 1) {
      this.focusNode(id);
    }

    this.notify();
  }

  unregisterNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // 1. Remove from parent's childrenIds
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter((c) => c !== id);
      }
    }

    // 2. Delete from node map
    this.nodes.delete(id);

    // 3. Clear passive flag
    this.passiveSet.delete(id);

    // 4. Clear pending focusFirstChild
    this.pendingFocusFirstChild.delete(id);

    // 5. Refocus if this node was focused
    // Walk parentMap (persistent, never deleted from) to find nearest living ancestor
    if (this.focusedId === id) {
      let candidate = node.parentId;
      while (candidate !== null) {
        if (this.nodes.has(candidate)) {
          this.focusNode(candidate);
          return;
        }
        candidate = this.parentMap.get(candidate) ?? null;
      }
      this.focusedId = null;
    }

    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Focus
  // ---------------------------------------------------------------------------

  focusNode(id: string): void {
    if (!this.nodes.has(id)) return;
    const oldFocusedId = this.focusedId;
    if (oldFocusedId === id) return;

    this.focusedId = id;

    // Clear passive flags for scopes that focus is leaving or entering
    for (const passiveId of this.passiveSet) {
      const wasAncestor = this.isAncestorOf(passiveId, oldFocusedId);
      const isAncestor = this.isAncestorOf(passiveId, id);

      // Focus left the passive scope's subtree → clear
      if (wasAncestor && !isAncestor) {
        this.passiveSet.delete(passiveId);
      }
      // Focus entered a descendant of the passive scope → clear (drill-in)
      if (isAncestor && id !== passiveId) {
        this.passiveSet.delete(passiveId);
      }
    }

    this.notify();
  }

  focusFirstChild(parentId: string): void {
    const parent = this.nodes.get(parentId);
    if (parent && parent.childrenIds.length > 0) {
      // Drill to deepest first child
      let target = parent.childrenIds[0];
      let targetNode = this.nodes.get(target);
      while (targetNode && targetNode.childrenIds.length > 0) {
        target = targetNode.childrenIds[0];
        targetNode = this.nodes.get(target);
      }
      this.focusNode(target);
    } else {
      this.pendingFocusFirstChild.add(parentId);
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  navigateSibling(direction: 'next' | 'prev', wrap: boolean = true, groupId?: string, shallow: boolean = false): void {
    if (!this.focusedId) return;

    let currentChildId: string | undefined;
    let siblings: string[];

    if (groupId) {
      const group = this.nodes.get(groupId);
      if (!group || group.childrenIds.length === 0) return;
      siblings = group.childrenIds;

      // Walk up from focusedId to find which direct child of the group contains focus
      let cursor: string | null = this.focusedId;
      while (cursor) {
        const node = this.nodes.get(cursor);
        if (node?.parentId === groupId) {
          currentChildId = cursor;
          break;
        }
        cursor = node?.parentId ?? null;
      }

      if (!currentChildId) {
        // Focus is not inside this group — land on first or last sibling
        const targetId = direction === 'next' ? siblings[0] : siblings[siblings.length - 1];
        if (!shallow && this.nodes.get(targetId)?.childrenIds.length) {
          this.focusFirstChild(targetId);
        } else {
          this.focusNode(targetId);
        }
        return;
      }
    } else {
      const currentNode = this.nodes.get(this.focusedId);
      if (!currentNode?.parentId) return;

      const parent = this.nodes.get(currentNode.parentId);
      if (!parent || parent.childrenIds.length === 0) return;
      siblings = parent.childrenIds;
      currentChildId = this.focusedId;
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
    const target = this.nodes.get(targetId);

    if (!shallow && target && target.childrenIds.length > 0) {
      this.focusFirstChild(targetId);
    } else {
      this.focusNode(targetId);
    }
  }

  // ---------------------------------------------------------------------------
  // Passive scopes
  // ---------------------------------------------------------------------------

  makePassive(id: string): void {
    if (!this.nodes.has(id)) return;
    this.passiveSet.add(id);
    this.focusNode(id);
  }

  isPassive(id: string): boolean {
    return this.passiveSet.has(id);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  isFocused(id: string): boolean {
    if (!this.focusedId) return false;
    let cursor: string | null = this.focusedId;
    while (cursor) {
      if (cursor === id) return true;
      const node = this.nodes.get(cursor);
      cursor = node?.parentId ?? null;
    }
    return false;
  }

  getFocusedId(): string | null {
    return this.focusedId;
  }

  getActiveBranchPath(): string[] {
    if (!this.focusedId) return [];
    const path: string[] = [];
    let cursor: string | null = this.focusedId;
    while (cursor) {
      path.push(cursor);
      const node = this.nodes.get(cursor);
      cursor = node?.parentId ?? null;
    }
    return path;
  }

  // ---------------------------------------------------------------------------
  // Trap
  // ---------------------------------------------------------------------------

  setTrap(nodeId: string): void {
    this.trapNodeId = nodeId;
  }

  clearTrap(nodeId: string): void {
    if (this.trapNodeId === nodeId) {
      this.trapNodeId = null;
    }
  }

  getTrapNodeId(): string | null {
    return this.trapNodeId;
  }

  // ---------------------------------------------------------------------------
  // Keybinding registry
  // ---------------------------------------------------------------------------

  registerKeybindings(
    nodeId: string,
    registrationId: string,
    bindings: Keybindings,
    options?: KeybindingOptions
  ): void {
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

    if (!this.keybindings.has(nodeId)) {
      this.keybindings.set(nodeId, new Map());
    }
    this.keybindings.get(nodeId)!.set(registrationId, registration);
  }

  unregisterKeybindings(nodeId: string, registrationId: string): void {
    const nodeRegistrations = this.keybindings.get(nodeId);
    if (nodeRegistrations) {
      nodeRegistrations.delete(registrationId);
      if (nodeRegistrations.size === 0) {
        this.keybindings.delete(nodeId);
      }
    }
  }

  getNodeBindings(nodeId: string): NodeBindings | undefined {
    const nodeRegistrations = this.keybindings.get(nodeId);
    if (!nodeRegistrations || nodeRegistrations.size === 0) return undefined;

    // Merge all registrations for this node in insertion order.
    // Later registrations override earlier ones for the same key.
    const mergedBindings = new Map<string, BindingEntry>();
    let finalCapture = false;
    let finalOnKeypress: ((input: string, key: Key) => void) | undefined;
    let finalPassthrough: Set<string> | undefined;
    let finalLayer: string | undefined;

    for (const registration of nodeRegistrations.values()) {
      const isCaptureRegistration = registration.onKeypress !== undefined;
      const shouldIncludeBindings = !isCaptureRegistration || registration.capture;

      if (shouldIncludeBindings) {
        for (const [key, entry] of registration.bindings) {
          mergedBindings.set(key, entry);
        }
      }

      if (registration.capture) {
        finalCapture = true;
        finalOnKeypress = registration.onKeypress;
        finalPassthrough = registration.passthrough;
      }

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
  }

  getAllBindings(): RegisteredKeybinding[] {
    const all: RegisteredKeybinding[] = [];
    for (const [nodeId, nodeRegistrations] of this.keybindings) {
      for (const registration of nodeRegistrations.values()) {
        for (const [key, entry] of registration.bindings) {
          all.push({
            nodeId,
            key,
            handler: entry.handler,
            name: entry.name,
            when: entry.when,
            layer: registration.layer
          });
        }
      }
    }
    return all;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  // Is `ancestor` an ancestor of `descendant`? (or equal)
  private isAncestorOf(ancestor: string, descendant: string | null): boolean {
    let cursor = descendant;
    while (cursor) {
      if (cursor === ancestor) return true;
      const node = this.nodes.get(cursor);
      cursor = node?.parentId ?? null;
    }
    return false;
  }
}
