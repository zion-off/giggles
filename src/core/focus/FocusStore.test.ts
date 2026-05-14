import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Key } from 'ink';
import type { KeyHandler } from '../input/types';
import { FocusStore } from './FocusStore';

// Cast vi.fn() to KeyHandler so TypeScript accepts it as a KeybindingDefinition
const mockHandler = (): KeyHandler => vi.fn() as unknown as KeyHandler;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function key(overrides: Partial<Key> = {}): Key {
  return {
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    return: false,
    escape: false,
    tab: false,
    shift: false,
    backspace: false,
    delete: false,
    pageUp: false,
    pageDown: false,
    home: false,
    end: false,
    ctrl: false,
    meta: false,
    ...overrides
  } as Key;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let store: FocusStore;

beforeEach(() => {
  store = new FocusStore();
});

// ---------------------------------------------------------------------------
// Node registration
// ---------------------------------------------------------------------------

describe('registerNode', () => {
  it('auto-focuses the first registered node', () => {
    store.registerNode('root', null);
    expect(store.getFocusedId()).toBe('root');
  });

  it('does not change focus when subsequent nodes register', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    expect(store.getFocusedId()).toBe('root');
  });

  it('links child to parent', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    expect(store.getActiveBranchPath()).toEqual(['root']);
    store.focusNode('child');
    expect(store.getActiveBranchPath()).toEqual(['child', 'root']);
  });

  it('adopts orphaned children that registered before their parent', () => {
    // child registers first (bottom-up React effect ordering)
    store.registerNode('child', 'root');
    store.registerNode('root', null);
    store.focusNode('child');
    expect(store.getActiveBranchPath()).toEqual(['child', 'root']);
  });

  it('is idempotent for same node+parent (re-render)', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');
    // Re-register child — should not wipe the node or change focus
    store.registerNode('child', 'root');
    expect(store.getFocusedId()).toBe('child');
  });

  it('updates focusKey index on re-register with new key', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root', 'old-key');
    // Re-register with a new key
    store.registerNode('child', 'root', 'new-key');
    store.focusChildByKey('root', 'new-key', true);
    expect(store.getFocusedId()).toBe('child');
  });
});

// ---------------------------------------------------------------------------
// Unregistration & refocus
// ---------------------------------------------------------------------------

describe('unregisterNode', () => {
  it('refocuses the nearest living ancestor when focused node is removed', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');
    store.unregisterNode('child');
    expect(store.getFocusedId()).toBe('root');
  });

  it('clears passive flag on unregister', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.makePassive('child');
    store.unregisterNode('child');
    expect(store.isPassive('child')).toBe(false);
  });

  it('sets focusedId to null when no living ancestor exists', () => {
    store.registerNode('root', null);
    store.unregisterNode('root');
    expect(store.getFocusedId()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

describe('isFocused', () => {
  it('returns true for the focused node itself', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');
    expect(store.isFocused('child')).toBe(true);
  });

  it('returns true for ancestors of the focused node', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');
    expect(store.isFocused('root')).toBe(true);
  });

  it('returns false for unrelated nodes', () => {
    store.registerNode('root', null);
    store.registerNode('a', 'root');
    store.registerNode('b', 'root');
    store.focusNode('a');
    expect(store.isFocused('b')).toBe(false);
  });
});

describe('getActiveBranchPath', () => {
  it('returns empty array when nothing is focused', () => {
    expect(store.getActiveBranchPath()).toEqual([]);
  });

  it('returns path from focused node to root', () => {
    store.registerNode('root', null);
    store.registerNode('mid', 'root');
    store.registerNode('leaf', 'mid');
    store.focusNode('leaf');
    expect(store.getActiveBranchPath()).toEqual(['leaf', 'mid', 'root']);
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('navigateSibling', () => {
  beforeEach(() => {
    store.registerNode('root', null);
    store.registerNode('a', 'root');
    store.registerNode('b', 'root');
    store.registerNode('c', 'root');
    store.focusNode('a');
  });

  it('moves to next sibling', () => {
    store.navigateSibling('next');
    expect(store.getFocusedId()).toBe('b');
  });

  it('moves to prev sibling', () => {
    store.focusNode('c');
    store.navigateSibling('prev');
    expect(store.getFocusedId()).toBe('b');
  });

  it('wraps from last to first', () => {
    store.focusNode('c');
    store.navigateSibling('next', true);
    expect(store.getFocusedId()).toBe('a');
  });

  it('wraps from first to last', () => {
    store.navigateSibling('prev', true);
    expect(store.getFocusedId()).toBe('c');
  });

  it('clamps at end when wrap is false', () => {
    store.focusNode('c');
    store.navigateSibling('next', false);
    expect(store.getFocusedId()).toBe('c');
  });

  it('clamps at start when wrap is false', () => {
    store.navigateSibling('prev', false);
    expect(store.getFocusedId()).toBe('a');
  });

  it('navigates within a specific group by groupId', () => {
    // root → a, b, c already set up; add a sibling group under b
    store.registerNode('b1', 'b');
    store.registerNode('b2', 'b');
    store.focusNode('b1');
    store.navigateSibling('next', true, 'b');
    expect(store.getFocusedId()).toBe('b2');
  });
});

describe('focusFirstChild', () => {
  it('drills to the deepest first child', () => {
    store.registerNode('root', null);
    store.registerNode('mid', 'root');
    store.registerNode('leaf', 'mid');
    store.focusFirstChild('root');
    expect(store.getFocusedId()).toBe('leaf');
  });

  it('queues when parent has no children yet and fulfills on next registerNode', () => {
    store.registerNode('root', null);
    store.focusFirstChild('root');
    store.registerNode('child', 'root');
    expect(store.getFocusedId()).toBe('child');
  });
});

describe('focusChildByKey', () => {
  beforeEach(() => {
    store.registerNode('root', null);
    store.registerNode('a', 'root', 'key-a');
    store.registerNode('b', 'root', 'key-b');
  });

  it('focuses the child with a matching key (shallow)', () => {
    store.focusChildByKey('root', 'key-b', true);
    expect(store.getFocusedId()).toBe('b');
  });

  it('drills into first grandchild when not shallow', () => {
    store.registerNode('b-child', 'b');
    store.focusChildByKey('root', 'key-b', false);
    expect(store.getFocusedId()).toBe('b-child');
  });

  it('does nothing for an unknown key', () => {
    store.focusNode('a');
    store.focusChildByKey('root', 'no-such-key', true);
    expect(store.getFocusedId()).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// Passive scopes
// ---------------------------------------------------------------------------

describe('makePassive / isPassive', () => {
  it('marks a node passive and focuses it', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');
    store.makePassive('child');
    expect(store.isPassive('child')).toBe(true);
    expect(store.getFocusedId()).toBe('child');
  });

  it('clears passive when focus leaves the scope subtree', () => {
    store.registerNode('root', null);
    store.registerNode('a', 'root');
    store.registerNode('b', 'root');
    store.makePassive('a');
    // Move focus to b (outside a's subtree)
    store.focusNode('b');
    expect(store.isPassive('a')).toBe(false);
  });

  it('clears passive when focus moves to a descendant (drill-in)', () => {
    store.registerNode('root', null);
    store.registerNode('scope', 'root');
    store.registerNode('leaf', 'scope');
    store.makePassive('scope');
    store.focusNode('leaf');
    expect(store.isPassive('scope')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Keybinding registry
// ---------------------------------------------------------------------------

describe('registerKeybindings / unregisterKeybindings', () => {
  it('registers and retrieves bindings', () => {
    store.registerNode('root', null);
    const handler = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: handler });
    const bindings = store.getNodeBindings('root');
    expect(bindings?.bindings.has('j')).toBe(true);
  });

  it('unregistering removes the registration', () => {
    store.registerNode('root', null);
    const handler = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: handler });
    store.unregisterKeybindings('root', 'reg1');
    expect(store.getNodeBindings('root')).toBeUndefined();
  });

  it('later registration overrides earlier one for the same key', () => {
    store.registerNode('root', null);
    const first = vi.fn();
    const second = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: first });
    store.registerKeybindings('root', 'reg2', { j: second });
    const bindings = store.getNodeBindings('root')!;
    bindings.bindings.get('j')!.handler('j', key());
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });

  it('preserves bindings from other registrations when one is removed', () => {
    store.registerNode('root', null);
    store.registerKeybindings('root', 'reg1', { j: mockHandler() });
    store.registerKeybindings('root', 'reg2', { k: mockHandler() });
    store.unregisterKeybindings('root', 'reg1');
    const bindings = store.getNodeBindings('root')!;
    expect(bindings.bindings.has('j')).toBe(false);
    expect(bindings.bindings.has('k')).toBe(true);
  });

  it('stores named bindings with their name', () => {
    store.registerNode('root', null);
    const handler = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: { action: handler, name: 'Move Down' } });
    const bindings = store.getNodeBindings('root')!;
    expect(bindings.bindings.get('j')?.name).toBe('Move Down');
  });
});

// ---------------------------------------------------------------------------
// Dispatch algorithm
// ---------------------------------------------------------------------------

describe('dispatch', () => {
  it('fires a named binding for the focused node', () => {
    store.registerNode('root', null);
    const handler = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: handler });
    store.dispatch('j', key());
    expect(handler).toHaveBeenCalledOnce();
  });

  it('stops the walk once a named binding fires — ancestor bindings are not called', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');

    const childHandler = vi.fn();
    const rootHandler = vi.fn();
    store.registerKeybindings('child', 'reg1', { j: childHandler });
    store.registerKeybindings('root', 'reg2', { j: rootHandler });

    store.dispatch('j', key());
    expect(childHandler).toHaveBeenCalledOnce();
    expect(rootHandler).not.toHaveBeenCalled();
  });

  it('defers fallback — ancestor named binding wins over child fallback', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');

    const fallback = vi.fn();
    const rootHandler = vi.fn();
    store.registerKeybindings('child', 'reg1', {}, { fallback });
    store.registerKeybindings('root', 'reg2', { j: rootHandler });

    store.dispatch('j', key());
    expect(rootHandler).toHaveBeenCalledOnce();
    expect(fallback).not.toHaveBeenCalled();
  });

  it('fires fallback when no named binding matches anywhere in the path', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');

    const fallback = vi.fn();
    store.registerKeybindings('child', 'reg1', {}, { fallback });

    store.dispatch('j', key());
    expect(fallback).toHaveBeenCalledOnce();
  });

  it('bubble key propagates past a node fallback to reach an ancestor named binding', () => {
    store.registerNode('root', null);
    store.registerNode('child', 'root');
    store.focusNode('child');

    const fallback = vi.fn();
    const rootHandler = vi.fn();
    store.registerKeybindings('child', 'reg1', {}, { fallback, bubble: ['j'] });
    store.registerKeybindings('root', 'reg2', { j: rootHandler });

    store.dispatch('j', key());
    expect(rootHandler).toHaveBeenCalledOnce();
    expect(fallback).not.toHaveBeenCalled();
  });

  it('skips passive nodes during dispatch', () => {
    store.registerNode('root', null);
    store.registerNode('scope', 'root');
    store.registerNode('leaf', 'scope');
    store.focusNode('leaf');
    store.makePassive('scope');

    const scopeHandler = vi.fn();
    const rootHandler = vi.fn();
    store.registerKeybindings('scope', 'reg1', { j: scopeHandler });
    store.registerKeybindings('root', 'reg2', { j: rootHandler });

    store.dispatch('j', key());
    expect(scopeHandler).not.toHaveBeenCalled();
    expect(rootHandler).toHaveBeenCalledOnce();
  });

  it('stops at the trap boundary — bindings outside the trap do not fire', () => {
    store.registerNode('root', null);
    store.registerNode('trap', 'root');
    store.registerNode('leaf', 'trap');
    store.focusNode('leaf');
    store.setTrap('trap');

    const rootHandler = vi.fn();
    store.registerKeybindings('root', 'reg1', { j: rootHandler });

    store.dispatch('j', key());
    expect(rootHandler).not.toHaveBeenCalled();
  });

  it('fires fallback inside the trap even when walk stops at boundary', () => {
    store.registerNode('root', null);
    store.registerNode('trap', 'root');
    store.registerNode('leaf', 'trap');
    store.focusNode('leaf');
    store.setTrap('trap');

    const fallback = vi.fn();
    store.registerKeybindings('leaf', 'reg1', {}, { fallback });

    store.dispatch('j', key());
    expect(fallback).toHaveBeenCalledOnce();
  });

  it('does nothing when no binding matches and there is no fallback', () => {
    store.registerNode('root', null);
    store.registerKeybindings('root', 'reg1', { j: mockHandler() });
    expect(() => store.dispatch('k', key())).not.toThrow();
  });

  it('ignores focus event codes', () => {
    store.registerNode('root', null);
    const fallback = vi.fn();
    store.registerKeybindings('root', 'reg1', {}, { fallback });
    store.dispatch('\x1b[I', key());
    expect(fallback).not.toHaveBeenCalled();
  });
});
