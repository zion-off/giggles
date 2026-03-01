import { normalizeKey } from '../input/normalizeKey';
import type { Key, KeyHandler, KeybindingOptions, Keybindings, RegisteredKeybinding } from '../input/types';

type FocusNode = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  focusKey?: string;
};

type BindingEntry = {
  handler: KeyHandler;
  name?: string;
};

type BindingRegistration = {
  bindings: Map<string, BindingEntry>;
  fallback?: (input: string, key: Key) => void;
  bubble?: Set<string>;
};

export type NodeBindings = {
  bindings: Map<string, BindingEntry>;
  fallback?: (input: string, key: Key) => void;
  bubble?: Set<string>;
};

export class FocusStore {
  private nodes: Map<string, FocusNode> = new Map();
  // Persistent parent record — never deleted from, used for ancestor-walk during unregistration
  private parentMap: Map<string, string | null> = new Map();
  private focusedId: string | null = null;
  private passiveSet: Set<string> = new Set();
  private pendingFocusFirstChild: Set<string> = new Set();
  private trapNodeId: string | null = null;
  private renderedScopes: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  private version = 0;
  // nodeId → registrationId → BindingRegistration
  // Both keybindings and nodes register synchronously during render.
  // A keybinding may exist for a node that has not yet appeared in the node tree —
  // this is safe because dispatch only walks nodes in the active branch path.
  private keybindings: Map<string, Map<string, BindingRegistration>> = new Map();
  // parentId → focusKey → childId
  private keyIndex: Map<string, Map<string, string>> = new Map();

  // ---------------------------------------------------------------------------
  // Subscription
  // ---------------------------------------------------------------------------

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private dirty = false;

  private notify(): void {
    this.version++;
    this.dirty = false;
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Mark the store as changed without notifying subscribers. Used when the
  // store is mutated during React's render phase (e.g. silent node registration)
  // where calling notify() would trigger subscription callbacks unsafely.
  // Call flush() in a useLayoutEffect to deliver the notification before paint.
  private markDirty(): void {
    this.dirty = true;
  }

  flush(): void {
    if (this.dirty) {
      this.notify();
    }
  }

  getVersion(): number {
    return this.version;
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  registerNode(id: string, parentId: string | null, focusKey?: string, silent: boolean = false): void {
    // If the node already exists with the same parent, this is a re-render.
    // Skip re-creation (which would wipe childrenIds) but update focusKey index.
    const existing = this.nodes.get(id);
    if (existing && existing.parentId === parentId) {
      if (focusKey !== existing.focusKey) {
        this.updateFocusKey(id, parentId, existing.focusKey, focusKey);
        existing.focusKey = focusKey;
        this.markDirty();
      }
      return;
    }

    // Parent changed — remove from the old parent's children list so it doesn't
    // become a phantom child that navigateSibling can land on unexpectedly.
    if (existing && existing.parentId !== parentId) {
      if (existing.parentId) {
        const oldParent = this.nodes.get(existing.parentId);
        if (oldParent) {
          oldParent.childrenIds = oldParent.childrenIds.filter((c) => c !== id);
        }
      }
      this.updateFocusKey(id, existing.parentId, existing.focusKey, undefined);
    }

    const node: FocusNode = { id, parentId, childrenIds: [], focusKey };
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
          if (silent) {
            this.setFocusedIdSilently(id);
          } else {
            this.focusNode(id);
          }
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

    // Index by focusKey under the parent so focusChildByKey can resolve it
    if (focusKey && parentId) {
      if (!this.keyIndex.has(parentId)) {
        this.keyIndex.set(parentId, new Map());
      }
      this.keyIndex.get(parentId)!.set(focusKey, id);
    }

    // Auto-focus the very first node added to the tree
    if (this.nodes.size === 1) {
      if (silent) {
        this.setFocusedIdSilently(id);
      } else {
        this.focusNode(id);
      }
    }

    if (silent) {
      this.markDirty();
    } else {
      this.notify();
    }
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

    // 5. Remove from parent's key index
    if (node.parentId) {
      const parentKeys = this.keyIndex.get(node.parentId);
      if (parentKeys) {
        for (const [key, childId] of parentKeys) {
          if (childId === id) {
            parentKeys.delete(key);
            break;
          }
        }
        if (parentKeys.size === 0) {
          this.keyIndex.delete(node.parentId);
        }
      }
    }
    // Remove this node's own key map (it can no longer be a parent)
    this.keyIndex.delete(id);

    // 6. Refocus if this node was focused
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
    this.clearPassiveOnFocusChange(oldFocusedId, id);
    this.notify();
  }

  // Set focusedId without notifying subscribers. Safe to call during React's
  // render phase. Clears passive flags the same way focusNode() does.
  private setFocusedIdSilently(id: string): void {
    const oldFocusedId = this.focusedId;
    if (oldFocusedId === id) return;
    this.focusedId = id;
    this.clearPassiveOnFocusChange(oldFocusedId, id);
    this.markDirty();
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

  focusChildByKey(parentId: string, key: string, shallow: boolean): void {
    const childId = this.keyIndex.get(parentId)?.get(key);
    if (!childId || !this.nodes.has(childId)) return;

    if (shallow) {
      this.focusNode(childId);
    } else {
      const child = this.nodes.get(childId)!;
      if (child.childrenIds.length > 0) {
        this.focusFirstChild(childId);
      } else {
        this.focusNode(childId);
      }
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

  registerFocusScopeComponent(id: string): void {
    this.renderedScopes.add(id);
  }

  unregisterFocusScopeComponent(id: string): void {
    this.renderedScopes.delete(id);
  }

  hasFocusScopeComponent(id: string): boolean {
    return this.renderedScopes.has(id);
  }

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
        return [key, { handler: def.action, name: def.name }];
      });

    const registration: BindingRegistration = {
      bindings: new Map(entries),
      fallback: options?.fallback,
      bubble: options?.bubble ? new Set(options.bubble) : undefined
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
    let finalFallback: ((input: string, key: Key) => void) | undefined;
    let finalBubble: Set<string> | undefined;

    for (const registration of nodeRegistrations.values()) {
      for (const [key, entry] of registration.bindings) {
        mergedBindings.set(key, entry);
      }

      if (registration.fallback) {
        finalFallback = registration.fallback;
        finalBubble = registration.bubble;
      }
    }

    return {
      bindings: mergedBindings,
      fallback: finalFallback,
      bubble: finalBubble
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
            name: entry.name
          });
        }
      }
    }
    return all;
  }

  // ---------------------------------------------------------------------------
  // Input dispatch
  // ---------------------------------------------------------------------------

  // Bridge target for InputRouter. Walks the active branch path with passive-scope
  // skipping, fallback handlers, and trap boundary — the full dispatch algorithm.
  //
  // Priority order (per node, walking focused → root):
  //   1. Named bindings — always checked first
  //   2. Fallback handler — deferred until after the full path walk, so named
  //      bindings at any ancestor still fire before the fallback kicks in.
  //      Keys in `bubble` skip the fallback and continue to the next ancestor.
  //   3. Trap boundary — stops the walk; fallback inside the trap still fires.
  dispatch(input: string, key: Key): void {
    const keyName = normalizeKey(input, key);
    if (!keyName) return;

    const path = this.getActiveBranchPath();
    const trapNodeId = this.trapNodeId;

    // Collect the first fallback handler encountered, but don't fire it yet —
    // we want ancestor named bindings to win over the fallback.
    let pendingFallback: ((input: string, key: Key) => void) | undefined;

    for (const nodeId of path) {
      // Passive scopes yield — skip them so their parent's bindings fire instead.
      if (this.passiveSet.has(nodeId)) continue;

      const nodeBindings = this.getNodeBindings(nodeId);
      if (nodeBindings) {
        const entry = nodeBindings.bindings.get(keyName);
        if (entry) {
          entry.handler(input, key);
          return;
        }

        if (!pendingFallback && nodeBindings.fallback) {
          if (nodeBindings.bubble?.has(keyName)) {
            // Key is in bubble — let it propagate to parent instead.
            continue;
          }
          pendingFallback = nodeBindings.fallback;
        }
      }

      if (nodeId === trapNodeId) {
        break;
      }
    }

    pendingFallback?.(input, key);
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

  // Clear passive flags when focus transitions between nodes.
  private clearPassiveOnFocusChange(oldFocusedId: string | null, newFocusedId: string): void {
    for (const passiveId of this.passiveSet) {
      const wasAncestor = this.isAncestorOf(passiveId, oldFocusedId);
      const isAncestor = this.isAncestorOf(passiveId, newFocusedId);

      // Focus left the passive scope's subtree → clear
      if (wasAncestor && !isAncestor) {
        this.passiveSet.delete(passiveId);
      }
      // Focus entered a descendant of the passive scope → clear (drill-in)
      if (isAncestor && newFocusedId !== passiveId) {
        this.passiveSet.delete(passiveId);
      }
    }
  }

  // Update the keyIndex when a node's focusKey changes during a re-render.
  private updateFocusKey(id: string, parentId: string | null, oldKey?: string, newKey?: string): void {
    if (!parentId) return;

    // Remove old key
    if (oldKey) {
      const parentKeys = this.keyIndex.get(parentId);
      if (parentKeys) {
        parentKeys.delete(oldKey);
        if (parentKeys.size === 0) {
          this.keyIndex.delete(parentId);
        }
      }
    }

    // Add new key
    if (newKey) {
      if (!this.keyIndex.has(parentId)) {
        this.keyIndex.set(parentId, new Map());
      }
      this.keyIndex.get(parentId)!.set(newKey, id);
    }
  }
}
