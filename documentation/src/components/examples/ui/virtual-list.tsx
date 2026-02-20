'use client';

import { GigglesProvider } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const items = Array.from({ length: 30 }, (_, i) => ({
  label: `Item ${i + 1}`,
  value: i + 1
}));

function Demo() {
  const [selected, setSelected] = useState(1);

  return (
    <Box flexDirection="column" gap={1}>
      <Select options={items} value={selected} onChange={setSelected} maxVisible={8} />
      <Text>
        Selected: <Text color="cyan">{selected}</Text>
      </Text>
      <Text dimColor>j/k to navigate, Enter to select</Text>
    </Box>
  );
}

export default function VirtualListExample() {
  return (
    <GigglesProvider>
      <Demo />
    </GigglesProvider>
  );
}
