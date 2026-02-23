'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope } from 'giggles';
import { Box, Text } from 'ink-web';

function Menu() {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })
  });

  return (
    <FocusScope handle={scope}>
      <MenuItem label="New File" />
      <MenuItem label="Open File" />
      <MenuItem label="Save" />
    </FocusScope>
  );
}

function MenuItem({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.hasFocus ? 'green' : 'white'}>
      {focus.hasFocus ? '> ' : '  '}
      {label}
    </Text>
  );
}

export default function NavigableMenuExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text bold>Menu</Text>
        <Menu />
        <Text dimColor>j/k to navigate</Text>
      </Box>
    </GigglesProvider>
  );
}
