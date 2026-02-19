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

type KeybindingDefinition = KeyHandler | { action: KeyHandler; name: string; when?: 'focused' | 'mounted' };

export type Keybindings = Partial<Record<KeyName, KeybindingDefinition>>;

export type KeybindingOptions = {
  capture?: boolean;
  onKeypress?: (input: string, key: Key) => void;
  passthrough?: string[];
  layer?: string;
};

export type RegisteredKeybinding = {
  nodeId: string;
  key: string;
  handler: KeyHandler;
  name?: string;
  when?: 'focused' | 'mounted';
  layer?: string;
};

export type { Key } from 'ink';
