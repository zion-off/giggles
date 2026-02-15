'use client';

import { FocusGroup, GigglesProvider, useFocus, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label }: { label: string }) {
  const focus = useFocus();
  const [selected, setSelected] = useState(false);

  useKeybindings(focus, {
    enter: () => setSelected(!selected)
  });

  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
      {selected ? ' ✓' : ''}
    </Text>
  );
}

export default function UseFocusExample() {
  return (
    <GigglesProvider>
      <Box flexDirection="column">
        <Text bold>My Menu (j/k to navigate, enter to select)</Text>
        <FocusGroup direction="vertical">
          <MenuItem label="Start Game" />
          <MenuItem label="Settings" />
          <MenuItem label="Exit" />
        </FocusGroup>
      </Box>
    </GigglesProvider>
  );
}
