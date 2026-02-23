'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope, useTheme } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileItem({ name, indent = false }: { name: string; indent?: boolean }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.hasFocus ? 'green' : 'white'}>
      {indent ? '    ' : '  '}
      {focus.hasFocus ? '> ' : '  '}
      {name}
    </Text>
  );
}

function FileList({ files, onClose }: { files: string[]; onClose: () => void }) {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({
      j: next,
      k: prev,
      down: next,
      up: prev,
      h: onClose
    })
  });
  return (
    <FocusScope handle={scope}>
      {files.map((f) => (
        <FileItem key={f} name={f} indent />
      ))}
    </FocusScope>
  );
}

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
        {open && <FileList files={files} onClose={() => setOpen(false)} />}
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
        <FileItem name="package.json" />
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
