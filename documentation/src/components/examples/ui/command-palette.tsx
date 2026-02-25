'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope, useKeybindings } from 'giggles';
import { CommandPalette } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileList() {
  const focus = useFocusNode();

  useKeybindings(focus, {
    d: { action: () => {}, name: 'Delete file' },
    r: { action: () => {}, name: 'Rename file' },
    'ctrl+c': { action: () => {}, name: 'Copy path' }
  });

  return (
    <Text bold={focus.hasFocus} dimColor={!focus.hasFocus}>
      {focus.hasFocus ? '> ' : '  '}File List
    </Text>
  );
}

function Sidebar() {
  const focus = useFocusNode();

  useKeybindings(focus, {
    n: { action: () => {}, name: 'New folder' },
    x: { action: () => {}, name: 'Expand all' }
  });

  return (
    <Text bold={focus.hasFocus} dimColor={!focus.hasFocus}>
      {focus.hasFocus ? '> ' : '  '}Sidebar
    </Text>
  );
}

function App() {
  const [showPalette, setShowPalette] = useState(false);

  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({
      tab: next,
      'shift+tab': prev,
      'ctrl+k': { action: () => setShowPalette(true), name: 'Open palette' },
      q: { action: () => {}, name: 'Quit' }
    })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={scope}>
        <Sidebar />
        <FileList />
      </FocusScope>
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
