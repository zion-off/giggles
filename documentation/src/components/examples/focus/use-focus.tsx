'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label }: { label: string }) {
  const focus = useFocusNode();
  const [selected, setSelected] = useState(false);

  useKeybindings(focus, {
    enter: () => setSelected(!selected)
  });

  return (
    <Text color={focus.hasFocus ? 'green' : 'white'}>
      {focus.hasFocus ? '> ' : '  '}
      {label}
      {selected ? ' ✓' : ''}
    </Text>
  );
}

function MyMenu() {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })
  });

  return (
    <FocusScope handle={scope}>
      <MenuItem label="Start Game" />
      <MenuItem label="Settings" />
      <MenuItem label="Exit" />
    </FocusScope>
  );
}

export default function UseFocusExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>My Menu</Text>
        <MyMenu />
        <Text dimColor>j/k to navigate, Enter to select</Text>
      </Box>
    </GigglesProvider>
  );
}
