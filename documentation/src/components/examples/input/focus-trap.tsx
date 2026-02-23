'use client';

import { FocusGroup, FocusTrap, GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label, onSelect }: { label: string; onSelect?: () => void }) {
  const focus = useFocusNode();

  useKeybindings(focus, {
    enter: () => onSelect?.()
  });

  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '▸ ' : '  '}
      {label}
    </Text>
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      gap={1}
      width={40}
      backgroundColor="black"
    >
      <Text bold color="yellow">
        {title}
      </Text>
      <Text>{message}</Text>
      <Box marginTop={1}>
        <FocusGroup
          keybindings={({ next, prev }) => ({
            j: next,
            k: prev,
            left: prev,
            right: next,
            escape: onCancel
          })}
        >
          <Box gap={2}>
            <MenuItem label="Confirm" onSelect={onConfirm} />
            <MenuItem label="Cancel" onSelect={onCancel} />
          </Box>
        </FocusGroup>
      </Box>
      <Text dimColor>←→/jk: navigate • enter: select • esc: cancel</Text>
    </Box>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [keyPressCount, setKeyPressCount] = useState(0);

  const openDialog = (actionName: string) => {
    setAction(actionName);
    setShowModal(true);
  };

  const handleConfirm = () => {
    setKeyPressCount((c) => c + 1);
    setShowModal(false);
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          Application Menu
        </Text>
        {keyPressCount > 0 && <Text color="green">✓ Actions performed: {keyPressCount}</Text>}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>Try pressing keys when modal is open - they won&apos;t work!</Text>
      </Box>

      <FocusGroup
        keybindings={({ next, prev }) => ({
          j: next,
          k: prev,
          down: next,
          up: prev
        })}
      >
        <MenuItem label="New File" onSelect={() => openDialog('create a new file')} />
        <MenuItem label="Open File" onSelect={() => openDialog('open a file')} />
        <MenuItem label="Save" onSelect={() => openDialog('save current file')} />
        <MenuItem label="Delete" onSelect={() => openDialog('delete a file')} />
        <MenuItem label="Exit" onSelect={() => openDialog('exit the application')} />
      </FocusGroup>

      {showModal && (
        <Box position="absolute" left={5} top={2}>
          <FocusTrap>
            <ConfirmDialog
              title="Confirm Action"
              message={`Are you sure you want to ${action}?`}
              onConfirm={handleConfirm}
              onCancel={() => setShowModal(false)}
            />
          </FocusTrap>
        </Box>
      )}

      <Text dimColor marginTop={1}>
        {showModal ? 'Keys outside modal are blocked!' : '↑↓/jk: navigate • enter: select'}
      </Text>
    </Box>
  );
}

export default function FocusTrapExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
