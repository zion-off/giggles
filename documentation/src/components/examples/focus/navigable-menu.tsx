'use client';

import { FocusGroup, GigglesProvider, useFocusNode } from 'giggles';
import { Box, Text } from 'ink-web';

function MenuItem({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
    </Text>
  );
}

export default function NavigableMenuExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text bold>Menu</Text>
        <FocusGroup keybindings={({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })}>
          <MenuItem label="New File" />
          <MenuItem label="Open File" />
          <MenuItem label="Save" />
        </FocusGroup>
        <Text dimColor>j/k to navigate</Text>
      </Box>
    </GigglesProvider>
  );
}
