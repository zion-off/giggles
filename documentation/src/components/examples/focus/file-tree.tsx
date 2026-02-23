'use client';

import { FocusGroup, GigglesProvider, useFocus, useFocusNode } from 'giggles';
import { Box, Text } from 'ink-web';
import { useEffect, useState } from 'react';

function FileItem({ name, indent = false, autoFocus = false }: { name: string; indent?: boolean; autoFocus?: boolean }) {
  const focus = useFocusNode();
  useEffect(() => {
    if (autoFocus) focus.focus();
  }, []);
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
  onClose,
}: {
  name: string;
  files: string[];
  open: boolean;
  onClose: () => void;
}) {
  const { focused } = useFocus();
  return (
    <Box flexDirection="column">
      <Text color={focused ? 'green' : 'white'}>
        {'  '}
        {open ? '▼' : '▶'} {name}/
      </Text>
      {open && (
        <FocusGroup
          wrap={false}
          keybindings={({ next, prev }) => ({
            j: next,
            k: prev,
            down: next,
            up: prev,
            h: onClose,
          })}
        >
          {files.map((f, i) => (
            <FileItem key={f} name={f} indent autoFocus={i === 0} />
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
      keybindings={open ? {} : { l: () => setOpen(true), enter: () => setOpen(true) }}
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
        <Text dimColor>j/k — navigate · l/enter — expand · h — collapse</Text>
      </Box>
    </GigglesProvider>
  );
}
