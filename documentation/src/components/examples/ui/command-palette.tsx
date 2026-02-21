'use client';

import { FocusGroup, GigglesProvider, useFocus, useKeybindings } from 'giggles';
import { CommandPalette } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileList() {
  const focus = useFocus();

  useKeybindings(focus, {
    d: { action: () => {}, name: 'Delete file' },
    r: { action: () => {}, name: 'Rename file' },
    'ctrl+c': { action: () => {}, name: 'Copy path' }
  });

  return (
    <Text bold={focus.focused} dimColor={!focus.focused}>
      {focus.focused ? '> ' : '  '}File List
    </Text>
  );
}

function Sidebar() {
  const focus = useFocus();

  useKeybindings(focus, {
    n: { action: () => {}, name: 'New folder' },
    x: { action: () => {}, name: 'Expand all' }
  });

  return (
    <Text bold={focus.focused} dimColor={!focus.focused}>
      {focus.focused ? '> ' : '  '}Sidebar
    </Text>
  );
}

function App() {
  const focus = useFocus();
  const [showPalette, setShowPalette] = useState(false);

  useKeybindings(focus, {
    'ctrl+k': { action: () => setShowPalette(true), name: 'Open palette', when: 'mounted' },
    q: { action: () => {}, name: 'Quit', when: 'mounted' }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusGroup>
        <Sidebar />
        <FileList />
      </FocusGroup>
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
      <Text dimColor>Tab to switch panels, Ctrl+K for palette</Text>
    </Box>
  );
}

export default function CommandPaletteExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
