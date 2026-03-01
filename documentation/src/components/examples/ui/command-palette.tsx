'use client';

import { GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { CommandPalette } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function App() {
  const [showPalette, setShowPalette] = useState(false);
  const [count, setCount] = useState(0);
  const focus = useFocusNode();

  useKeybindings(focus, {
    'ctrl+k': { action: () => setShowPalette(true), name: 'Open palette' },
    '+': { action: () => setCount((c) => c + 1), name: 'Increment' },
    '-': { action: () => setCount((c) => c - 1), name: 'Decrement' },
    r: { action: () => setCount(0), name: 'Reset' }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text>
        Count: <Text bold>{count}</Text>
      </Text>
      {showPalette ? <CommandPalette onClose={() => setShowPalette(false)} /> : <CommandPalette interactive={false} />}
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
