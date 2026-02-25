'use client';

import { GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const INITIAL_FILES = [
  { name: 'App.tsx', size: '2.4 KB', type: 'tsx' },
  { name: 'utils.ts', size: '1.8 KB', type: 'ts' },
  { name: 'styles.css', size: '856 B', type: 'css' },
  { name: 'config.json', size: '234 B', type: 'json' },
  { name: 'README.md', size: '1.2 KB', type: 'md' },
  { name: 'package.json', size: '458 B', type: 'json' },
  { name: 'index.html', size: '512 B', type: 'html' }
];

function FileList() {
  const focus = useFocusNode();
  const [selected, setSelected] = useState(0);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const filteredFiles = searchMode
    ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const deleteFile = () => {
    if (filteredFiles.length === 0) return;
    const fileToDelete = filteredFiles[selected];
    setFiles(files.filter((f) => f.name !== fileToDelete.name));
    setSelected(Math.max(0, Math.min(selected, filteredFiles.length - 2)));
    setMessage(`Deleted ${fileToDelete.name}`);
    setTimeout(() => setMessage(''), 2000);
  };

  const openFile = () => {
    if (filteredFiles.length === 0) return;
    const file = filteredFiles[selected];
    setMessage(`Opened ${file.name}`);
    setTimeout(() => setMessage(''), 2000);
  };

  // Navigation and action keybindings
  useKeybindings(focus, {
    j: () => setSelected((i) => Math.min(filteredFiles.length - 1, i + 1)),
    k: () => setSelected((i) => Math.max(0, i - 1)),
    down: () => setSelected((i) => Math.min(filteredFiles.length - 1, i + 1)),
    up: () => setSelected((i) => Math.max(0, i - 1)),
    enter: openFile,
    d: deleteFile,
    '/': () => {
      setSearchMode(true);
      setSearchQuery('');
    },
    escape: () => {
      setSearchMode(false);
      setSearchQuery('');
      setSelected(0);
    }
  });

  // Search mode — when active, fallback intercepts all keys for text input
  useKeybindings(
    focus,
    searchMode
      ? {
          enter: () => {
            setSearchMode(false);
            setSelected(0);
          }
        }
      : {},
    searchMode
      ? {
          fallback: (input, key) => {
            if (key.backspace || key.delete) {
              setSearchQuery((q) => q.slice(0, -1));
            } else if (!key.ctrl && !key.meta && input) {
              setSearchQuery((q) => q + input);
            }
          },
          bubble: ['escape', 'enter']
        }
      : undefined
  );

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          File Manager
        </Text>
        {message && <Text color="yellow">{message}</Text>}
      </Box>

      {searchMode ? (
        <Box>
          <Text color="magenta">Search: </Text>
          <Text>{searchQuery}</Text>
          <Text color="grey">█</Text>
        </Box>
      ) : null}

      <Box flexDirection="column">
        {filteredFiles.length === 0 ? (
          <Text dimColor>No files match</Text>
        ) : (
          filteredFiles.map((file, i) => (
            <Box key={file.name} gap={1}>
              <Text color={i === selected ? 'green' : 'white'}>
                {i === selected ? '▸ ' : '  '}
                {file.name}
              </Text>
              <Text dimColor>{file.size}</Text>
            </Box>
          ))
        )}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>
          {searchMode
            ? 'Type to search • esc to cancel • enter to apply'
            : '↑↓/jk: navigate • enter: open • d: delete • /: search'}
        </Text>
      </Box>
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
