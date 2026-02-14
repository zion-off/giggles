import { useState } from 'react';
import { Box, Text } from 'ink';
import { useFocus, useKeybindings } from '../../src';

export function MenuItem({ label }: { label: string }) {
  const focus = useFocus();
  const [activated, setActivated] = useState(false);

  useKeybindings(focus, {
    enter: () => setActivated(true),
    escape: () => setActivated(false)
  });

  return (
    <Box>
      <Text color={focus.focused ? 'green' : 'white'}>
        {focus.focused ? '> ' : '  '}
        {label}
        {activated ? ' ✓' : ''}
      </Text>
    </Box>
  );
}
