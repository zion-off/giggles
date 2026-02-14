import type { Key } from 'ink';

export type KeyHandler = (input: string, key: Key) => boolean | void;

export type KeyBindings = Record<string, KeyHandler>;

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
