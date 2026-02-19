'use client';

import { FocusGroup, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';

function MenuItem({ label }: { label: string }) {
  const focus = useFocus();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
    </Text>
  );
}

export default function NavigableMenuExample() {
  return (
    <GigglesProvider>
      <Box flexDirection="column">
        <Text bold>Menu (j/k to navigate)</Text>
        <FocusGroup direction="vertical">
          <MenuItem label="New File" />
          <MenuItem label="Open File" />
          <MenuItem label="Save" />
        </FocusGroup>
      </Box>
    </GigglesProvider>
  );
}
