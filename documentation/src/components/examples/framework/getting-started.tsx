'use client';

import { GigglesProvider } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const menuItems = [
  { label: 'New Game', value: 'new' },
  { label: 'Continue', value: 'continue' },
  { label: 'Settings', value: 'settings' },
  { label: 'Quit', value: 'quit' }
];

function Demo() {
  const [choice, setChoice] = useState('new');

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>My App</Text>
      <Select options={menuItems} value={choice} onChange={setChoice} />
      <Text dimColor>Selected: {choice}</Text>
    </Box>
  );
}

export default function GettingStartedExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Demo />
    </GigglesProvider>
  );
}
