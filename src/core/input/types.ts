import type { Key } from 'ink';

export type KeyHandler = (input: string, key: Key) => void;

type SpecialKey =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'backspace'
  | 'delete'
  | 'pageup'
  | 'pagedown'
  | 'home'
  | 'end';

type KeyName = SpecialKey | (string & {});

export type Keybindings = Partial<Record<KeyName, KeyHandler>>;

export type KeybindingOptions = {
  capture?: boolean;
  onKeypress?: (input: string, key: Key) => void;
  layer?: string;
};

export type RegisteredKeybinding = {
  nodeId: string;
  key: string;
  handler: KeyHandler;
  layer?: string;
};

export type { Key } from 'ink';
