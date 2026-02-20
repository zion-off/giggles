'use client';

import { GigglesProvider } from 'giggles';
import { MultiSelect } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const features = [
  { label: 'Router', value: 'router' },
  { label: 'Focus Management', value: 'focus' },
  { label: 'Keybindings', value: 'keybindings' },
  { label: 'Command Palette', value: 'palette' }
];

function Demo() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <Box flexDirection="column" gap={1}>
      <MultiSelect options={features} value={selected} onChange={setSelected} />
      <Text dimColor>j/k to navigate, Space to toggle</Text>
    </Box>
  );
}

export default function MultiSelectExample() {
  return (
    <GigglesProvider>
      <Demo />
    </GigglesProvider>
  );
}
