'use client';

import { FocusGroup, GigglesProvider, useFocus, useKeybindingRegistry, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';

function FileList() {
  const focus = useFocus();

  useKeybindings(focus, {
    d: { action: () => {}, name: 'Delete file' },
    r: { action: () => {}, name: 'Rename file' },
    'ctrl+c': { action: () => {}, name: 'Copy path' }
  });

  return (
    <Box flexDirection="column">
      <Text bold color={focus.focused ? 'cyan' : 'white'}>
        {focus.focused ? '> ' : '  '}File List
      </Text>
    </Box>
  );
}

function Sidebar() {
  const focus = useFocus();

  useKeybindings(focus, {
    n: { action: () => {}, name: 'New folder' },
    x: { action: () => {}, name: 'Expand all' }
  });

  return (
    <Box flexDirection="column">
      <Text bold color={focus.focused ? 'cyan' : 'white'}>
        {focus.focused ? '> ' : '  '}Sidebar
      </Text>
    </Box>
  );
}

function KeyHints() {
  const registry = useKeybindingRegistry();

  return (
    <Box gap={2} flexWrap="wrap">
      {registry.available.map((cmd) => (
        <Box key={`${cmd.nodeId}-${cmd.key}`} gap={1}>
          <Text inverse> {cmd.key} </Text>
          <Text dimColor>{cmd.name}</Text>
        </Box>
      ))}
    </Box>
  );
}

function App() {
  const focus = useFocus();

  useKeybindings(focus, {
    q: { action: () => {}, name: 'Quit', when: 'mounted' }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <FocusGroup>
        <Sidebar />
        <FileList />
      </FocusGroup>
      <Box borderStyle="single" paddingX={1}>
        <KeyHints />
      </Box>
      <Text dimColor>j/k to switch panels</Text>
    </Box>
  );
}

export default function CommandPaletteExample() {
  return (
    <GigglesProvider>
      <App />
    </GigglesProvider>
  );
}
