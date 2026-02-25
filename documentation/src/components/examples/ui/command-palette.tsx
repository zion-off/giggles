'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope, useKeybindings } from 'giggles';
import { CommandPalette } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileList({ log }: { log: (msg: string) => void }) {
  const focus = useFocusNode();

  useKeybindings(focus, {
    d: { action: () => log('Deleted file'), name: 'Delete file' },
    r: { action: () => log('Renamed file'), name: 'Rename file' },
    'ctrl+c': { action: () => log('Copied path'), name: 'Copy path' }
  });

  return (
    <Text bold={focus.hasFocus} dimColor={!focus.hasFocus}>
      {focus.hasFocus ? '> ' : '  '}File List
    </Text>
  );
}

function Sidebar({ log }: { log: (msg: string) => void }) {
  const focus = useFocusNode();

  useKeybindings(focus, {
    n: { action: () => log('Created new folder'), name: 'New folder' },
    x: { action: () => log('Expanded all'), name: 'Expand all' }
  });

  return (
    <Text bold={focus.hasFocus} dimColor={!focus.hasFocus}>
      {focus.hasFocus ? '> ' : '  '}Sidebar
    </Text>
  );
}

function App() {
  const [showPalette, setShowPalette] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const log = (msg: string) => setLastAction(msg);

  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({
      tab: next,
      'shift+tab': prev,
      'ctrl+k': { action: () => setShowPalette(true), name: 'Open palette' },
      q: { action: () => log('Quit'), name: 'Quit' }
    })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={scope}>
        <Sidebar log={log} />
        <FileList log={log} />
      </FocusScope>
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
      <Box>
        <Text dimColor>
          {lastAction ? (
            <Text>
              <Text color="green">✓ </Text>
              {lastAction}
            </Text>
          ) : (
            'Tab to switch panels, Ctrl+K for palette'
          )}
        </Text>
      </Box>
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
