import { useState } from 'react';
import { Box, Text } from 'ink';
import { FocusScope, useFocusScope } from '../core/focus';
import { FocusTrap, useKeybindingRegistry } from '../core/input';
import type { Key, RegisteredKeybinding } from '../core/input';
import { useTheme } from '../core/theme';
import { TextInput } from './TextInput';
import { VirtualList } from './VirtualList';

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
  onChange: (query: string) => void;
  filtered: RegisteredKeybinding[];
  selectedIndex: number;
  onSelect: (cmd: RegisteredKeybinding) => void;
};

type CommandPaletteProps = {
  onClose?: () => void;
  interactive?: boolean;
  maxVisible?: number;
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

function Inner({
  onClose,
  maxVisible = 10,
  render
}: {
  onClose: () => void;
  maxVisible?: number;
  render?: CommandPaletteProps['render'];
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const registry = useKeybindingRegistry();

  const named = registry.all.filter((cmd) => cmd.name != null);
  const filtered = named.filter((cmd) => fuzzyMatch(cmd.name!, query));
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  const onSelect = (cmd: RegisteredKeybinding) => {
    cmd.handler('', EMPTY_KEY);
    onClose();
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  const scope = useFocusScope({
    keybindings: {
      escape: onClose,
      enter: () => {
        const cmd = filtered[clampedIndex];
        if (cmd) onSelect(cmd);
      },
      up: () => setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length),
      down: () => setSelectedIndex((i) => (i + 1) % filtered.length)
    }
  });

  if (render) {
    return (
      <FocusScope handle={scope}>
        {render({ query, onChange: handleChange, filtered, selectedIndex: clampedIndex, onSelect })}
      </FocusScope>
    );
  }

  return (
    <FocusScope handle={scope}>
      <Box flexDirection="column">
        <TextInput label=">" value={query} onChange={handleChange} placeholder="Search commands…" />
        <Box flexDirection="column" marginTop={1}>
          {filtered.length === 0 ? (
            <Text dimColor>No commands found</Text>
          ) : (
            <VirtualList
              items={filtered}
              highlightIndex={clampedIndex}
              maxVisible={maxVisible}
              paginatorStyle="scrollbar"
              render={({ item: cmd, index }) => {
                const highlighted = index === clampedIndex;
                const keyColor = highlighted ? theme.hintHighlightColor : theme.hintColor;
                const labelColor = highlighted ? theme.hintHighlightDimColor : theme.hintDimColor;
                return (
                  <Text>
                    <Text dimColor>{highlighted ? theme.indicator + ' ' : '  '}</Text>
                    <Text color={keyColor} bold>
                      {cmd.key}
                    </Text>
                    <Text color={labelColor}> {cmd.name}</Text>
                  </Text>
                );
              }}
            />
          )}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>↑↓ navigate · ↵ run · esc close</Text>
        </Box>
      </Box>
    </FocusScope>
  );
}

function HintsBar() {
  const registry = useKeybindingRegistry();
  const theme = useTheme();
  const commands = registry.available.filter((cmd) => cmd.name != null);

  if (commands.length === 0) return null;

  return (
    <Box flexWrap="wrap">
      {commands.map((cmd, index) => (
        <Text key={`${cmd.nodeId}-${cmd.key}`}>
          <Text color={theme.hintColor} bold>
            {cmd.key}
          </Text>
          <Text color={theme.hintDimColor}> {cmd.name}</Text>
          {index < commands.length - 1 && <Text color={theme.hintDimColor}> • </Text>}
        </Text>
      ))}
    </Box>
  );
}

const noop = () => {};

export function CommandPalette({ onClose, interactive = true, maxVisible, render }: CommandPaletteProps) {
  if (!interactive) {
    return <HintsBar />;
  }

  return (
    <FocusTrap>
      <Inner onClose={onClose ?? noop} maxVisible={maxVisible} render={render} />
    </FocusTrap>
  );
}
