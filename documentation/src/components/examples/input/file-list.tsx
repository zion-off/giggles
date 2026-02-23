'use client';

import { GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileList() {
  const focus = useFocusNode();
  const [selected, setSelected] = useState(0);
  const files = ['file1.ts', 'file2.ts', 'file3.ts'];

  useKeybindings(focus, {
    j: () => setSelected((i) => Math.min(files.length - 1, i + 1)),
    k: () => setSelected((i) => Math.max(0, i - 1))
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Files</Text>
      <Box flexDirection="column">
        {files.map((file, i) => (
          <Text key={file} color={i === selected ? 'green' : 'white'}>
            {i === selected ? '> ' : '  '}
            {file}
          </Text>
        ))}
      </Box>
      <Text dimColor>j/k to select</Text>
    </Box>
  );
}

export default function FileListExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <FileList />
    </GigglesProvider>
  );
}
