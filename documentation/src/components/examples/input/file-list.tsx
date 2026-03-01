'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { Select, TextInput } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const FILES = [
  { label: 'App.tsx       2.4 KB', value: 'App.tsx' },
  { label: 'utils.ts      1.8 KB', value: 'utils.ts' },
  { label: 'styles.css    856 B', value: 'styles.css' },
  { label: 'config.json   234 B', value: 'config.json' },
  { label: 'README.md     1.2 KB', value: 'README.md' },
  { label: 'package.json  458 B', value: 'package.json' }
];

function FileManager() {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const options = FILES.filter((f) => !query || f.value.toLowerCase().includes(query.toLowerCase()));

  const scope = useFocusScope({
    keybindings: ({ focusChild, next, prev }) => ({
      '/': () => focusChild('search'),
      escape: () => {
        setQuery('');
        focusChild('list');
      },
      tab: next,
      'shift+tab': prev
    })
  });

  const open = (name: string) => {
    setMessage(`Opened ${name}`);
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Box justifyContent="space-between">
        <Text bold>File Manager</Text>
        {message && <Text color="yellow">{message}</Text>}
      </Box>
      <FocusScope handle={scope}>
        <TextInput
          focusKey="search"
          label="/"
          value={query}
          onChange={setQuery}
          onSubmit={() => scope.focusChild('list')}
          placeholder="filter files…"
        />
        {options.length === 0 ? (
          <Text dimColor>No matches</Text>
        ) : (
          <Select focusKey="list" options={options} onSubmit={open} />
        )}
      </FocusScope>
      <Text dimColor>/ to search · tab to switch · j/k to navigate · enter to open</Text>
    </Box>
  );
}

export default function FileListExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <FileManager />
    </GigglesProvider>
  );
}
