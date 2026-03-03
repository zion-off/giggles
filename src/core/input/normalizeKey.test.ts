import { describe, expect, it } from 'vitest';
import type { Key } from 'ink';
import { normalizeKey } from './normalizeKey';

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

describe('normalizeKey', () => {
  it('filters focus-in event code to empty string', () => {
    expect(normalizeKey('\x1b[I', key())).toBe('');
  });

  it('filters focus-out event code to empty string', () => {
    expect(normalizeKey('\x1b[O', key())).toBe('');
  });

  it('maps downArrow to "down"', () => {
    expect(normalizeKey('', key({ downArrow: true }))).toBe('down');
  });

  it('maps upArrow to "up"', () => {
    expect(normalizeKey('', key({ upArrow: true }))).toBe('up');
  });

  it('maps leftArrow to "left"', () => {
    expect(normalizeKey('', key({ leftArrow: true }))).toBe('left');
  });

  it('maps rightArrow to "right"', () => {
    expect(normalizeKey('', key({ rightArrow: true }))).toBe('right');
  });

  it('maps return to "enter"', () => {
    expect(normalizeKey('', key({ return: true }))).toBe('enter');
  });

  it('maps escape to "escape"', () => {
    expect(normalizeKey('', key({ escape: true }))).toBe('escape');
  });

  it('maps tab to "tab"', () => {
    expect(normalizeKey('', key({ tab: true }))).toBe('tab');
  });

  it('maps shift+tab to "shift+tab"', () => {
    expect(normalizeKey('', key({ tab: true, shift: true }))).toBe('shift+tab');
  });

  it('maps delete escape sequence to "delete"', () => {
    expect(normalizeKey('\x1b[3~', key())).toBe('delete');
  });

  it('maps backspace to "backspace"', () => {
    expect(normalizeKey('', key({ backspace: true }))).toBe('backspace');
  });

  it('maps delete key to "backspace"', () => {
    expect(normalizeKey('', key({ delete: true }))).toBe('backspace');
  });

  it('maps pageUp to "pageup"', () => {
    expect(normalizeKey('', key({ pageUp: true }))).toBe('pageup');
  });

  it('maps pageDown to "pagedown"', () => {
    expect(normalizeKey('', key({ pageDown: true }))).toBe('pagedown');
  });

  it('maps home to "home"', () => {
    expect(normalizeKey('', key({ home: true }))).toBe('home');
  });

  it('maps end to "end"', () => {
    expect(normalizeKey('', key({ end: true }))).toBe('end');
  });

  it('maps ctrl+single-char to "ctrl+<char>"', () => {
    expect(normalizeKey('a', key({ ctrl: true }))).toBe('ctrl+a');
    expect(normalizeKey('r', key({ ctrl: true }))).toBe('ctrl+r');
  });

  it('does not apply ctrl prefix for multi-char input', () => {
    expect(normalizeKey('ab', key({ ctrl: true }))).toBe('ab');
  });

  it('passes plain characters through unchanged', () => {
    expect(normalizeKey('j', key())).toBe('j');
    expect(normalizeKey('k', key())).toBe('k');
    expect(normalizeKey(' ', key())).toBe(' ');
  });
});
