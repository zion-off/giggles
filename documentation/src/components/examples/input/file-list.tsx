'use client';

import { GigglesProvider, useFocus, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileList() {
  const focus = useFocus();
  const [selected, setSelected] = useState(0);
  const files = ['file1.ts', 'file2.ts', 'file3.ts'];

  useKeybindings(focus, {
    j: () => setSelected((i) => Math.min(files.length - 1, i + 1)),
    k: () => setSelected((i) => Math.max(0, i - 1))
  });

  return (
    <Box flexDirection="column">
      <Text bold>Files (j/k to select)</Text>
      {files.map((file, i) => (
        <Text key={file} color={i === selected ? 'green' : 'white'}>
          {i === selected ? '> ' : '  '}
          {file}
        </Text>
      ))}
    </Box>
  );
}

export default function FileListExample() {
  return (
    <GigglesProvider>
      <FileList />
    </GigglesProvider>
  );
}
