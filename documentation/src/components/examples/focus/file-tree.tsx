'use client';

import { FocusGroup, GigglesProvider, useFocus, useFocusNode, useTheme } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function FileItem({ name, indent = false }: { name: string; indent?: boolean }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {indent ? '  ' : '  '}
      {focus.focused ? '> ' : '  '}
      {name}
    </Text>
  );
}

function DirContent({
  name,
  files,
  open,
  onClose
}: {
  name: string;
  files: string[];
  open: boolean;
  onClose: () => void;
}) {
  const { focused } = useFocus();
  const { indicator, indicatorOpen } = useTheme();
  return (
    <Box flexDirection="column">
      <Text color={focused ? 'green' : 'white'}>
        {'  '}
        {open ? indicatorOpen : indicator} {name}/
      </Text>
      {open && (
        <FocusGroup
          wrap={false}
          keybindings={({ next, prev }) => ({
            j: next,
            k: prev,
            down: next,
            up: prev,
            h: onClose
          })}
        >
          {files.map((f) => (
            <FileItem key={f} name={f} indent />
          ))}
        </FocusGroup>
      )}
    </Box>
  );
}

function DirItem({ name, files }: { name: string; files: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <FocusGroup
      keybindings={({ next }) =>
        open ? { j: next, h: () => setOpen(false) } : { l: () => setOpen(true), enter: () => setOpen(true) }
      }
    >
      <DirContent name={name} files={files} open={open} onClose={() => setOpen(false)} />
    </FocusGroup>
  );
}

export default function FileTreeExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text bold>Files</Text>
        <FocusGroup keybindings={({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })}>
          <DirItem name="src" files={['index.ts', 'utils.ts', 'types.ts']} />
          <DirItem name="tests" files={['unit.test.ts', 'e2e.test.ts']} />
          <FileItem name="package.json" />
        </FocusGroup>
        <Text dimColor>j/k — navigate · l — expand · j — enter · h — collapse</Text>
      </Box>
    </GigglesProvider>
  );
}
