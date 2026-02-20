'use client';

import { GigglesProvider } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const languages = [
  { label: 'TypeScript', value: 'ts' },
  { label: 'Rust', value: 'rs' },
  { label: 'Go', value: 'go' },
  { label: 'Python', value: 'py' }
];

function Demo() {
  const [lang, setLang] = useState('ts');

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Select options={languages} value={lang} onChange={setLang} />
      <Text dimColor>Selected: {lang}</Text>
    </Box>
  );
}

export default function SelectExample() {
  return (
    <GigglesProvider>
      <Demo />
    </GigglesProvider>
  );
}
