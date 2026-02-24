'use client';

import { FocusScope, GigglesProvider, useFocusScope, useTheme } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function DirItem({ name, files }: { name: string; files: string[] }) {
  const [open, setOpen] = useState(false);
  const { indicator, indicatorOpen } = useTheme();

  const scope = useFocusScope({
    keybindings: ({ next }) =>
      open ? { j: next, h: () => setOpen(false) } : { l: () => setOpen(true), enter: () => setOpen(true) }
  });

  return (
    <FocusScope handle={scope}>
      <Box flexDirection="column">
        <Text color={scope.hasFocus ? 'green' : 'white'}>
          {'  '}
          {open ? indicatorOpen : indicator} {name}/
        </Text>
        {open && <Select options={files.map((f) => ({ label: '    ' + f, value: f }))} />}
      </Box>
    </FocusScope>
  );
}

function FileTree() {
  const root = useFocusScope({
    keybindings: ({ nextShallow, prevShallow }) => ({
      j: nextShallow,
      k: prevShallow,
      down: nextShallow,
      up: prevShallow
    })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Files</Text>
      <FocusScope handle={root}>
        <DirItem name="src" files={['index.ts', 'utils.ts', 'types.ts']} />
        <DirItem name="tests" files={['unit.test.ts', 'e2e.test.ts']} />
      </FocusScope>
      <Text dimColor>j/k — navigate · l — expand · j — enter · h — collapse</Text>
    </Box>
  );
}

export default function FileTreeExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <FileTree />
    </GigglesProvider>
  );
}
