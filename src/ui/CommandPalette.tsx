import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useFocus } from '../core/focus';
import { FocusTrap, useKeybindingRegistry, useKeybindings } from '../core/input';
import type { Key, RegisteredKeybinding } from '../core/input';

const EMPTY_KEY: Key = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  home: false,
  end: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
  super: false,
  hyper: false,
  capsLock: false,
  numLock: false
};

export type CommandPaletteRenderProps = {
  query: string;
  filtered: RegisteredKeybinding[];
  selectedIndex: number;
  onSelect: (cmd: RegisteredKeybinding) => void;
};

type CommandPaletteProps = {
  onClose: () => void;
  render?: (props: CommandPaletteRenderProps) => React.ReactNode;
};

function fuzzyMatch(name: string, query: string): boolean {
  if (!query) return true;
  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lowerName.length && qi < lowerQuery.length; i++) {
    if (lowerName[i] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

function Inner({ onClose, render }: CommandPaletteProps) {
  const focus = useFocus();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const registry = useKeybindingRegistry();

  const filtered = registry.all.filter((cmd) => fuzzyMatch(cmd.name!, query));
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  const onSelect = (cmd: RegisteredKeybinding) => {
    cmd.handler('', EMPTY_KEY);
    onClose();
  };

  useKeybindings(
    focus,
    {
      escape: onClose,
      enter: () => {
        const cmd = filtered[clampedIndex];
        if (cmd) onSelect(cmd);
      },
      up: () => setSelectedIndex((i) => Math.max(0, i - 1)),
      down: () => setSelectedIndex((i) => Math.max(0, Math.min(filtered.length - 1, i + 1))),
      backspace: () => {
        setQuery((q) => q.slice(0, -1));
        setSelectedIndex(0);
      }
    },
    {
      capture: true,
      onKeypress: (input, key) => {
        if (input.length === 1 && !key.ctrl) {
          setQuery((q) => q + input);
          setSelectedIndex(0);
        }
      }
    }
  );

  if (render) {
    return <>{render({ query, filtered, selectedIndex: clampedIndex, onSelect })}</>;
  }

  return (
    <Box flexDirection="column" borderStyle="round" width={40}>
      <Box paddingX={1}>
        <Text dimColor>{'> '}</Text>
        <Text>{query}</Text>
        <Text inverse> </Text>
      </Box>
      <Box flexDirection="column">
        {filtered.length === 0 ? (
          <Box paddingX={1}>
            <Text dimColor>No commands found</Text>
          </Box>
        ) : (
          filtered.map((cmd, i) => (
            <Box key={`${cmd.nodeId}-${cmd.key}`} justifyContent="space-between" paddingX={1}>
              <Text inverse={i === clampedIndex}>{cmd.name}</Text>
              <Text dimColor>{cmd.key}</Text>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export function CommandPalette({ onClose, render }: CommandPaletteProps) {
  return (
    <FocusTrap>
      <Inner onClose={onClose} render={render} />
    </FocusTrap>
  );
}
