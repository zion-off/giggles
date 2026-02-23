'use client';

import { FocusScope, FocusTrap, GigglesProvider, useFocusNode, useFocusScope, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label, onSelect }: { label: string; onSelect?: () => void }) {
  const focus = useFocusNode();

  useKeybindings(focus, {
    enter: () => onSelect?.()
  });

  return (
    <Text color={focus.hasFocus ? 'green' : 'white'}>
      {focus.hasFocus ? '▸ ' : '  '}
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
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({
      j: next,
      k: prev,
      left: prev,
      right: next,
      escape: onCancel
    })
  });

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
      <FocusScope handle={scope}>
        <Box marginTop={1} gap={2}>
          <MenuItem label="Confirm" onSelect={onConfirm} />
          <MenuItem label="Cancel" onSelect={onCancel} />
        </Box>
      </FocusScope>
      <Text dimColor>←→/jk: navigate • enter: select • esc: cancel</Text>
    </Box>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [keyPressCount, setKeyPressCount] = useState(0);

  const menuScope = useFocusScope({
    keybindings: ({ next, prev }) => ({
      j: next,
      k: prev,
      down: next,
      up: prev
    })
  });

  const openDialog = (actionName: string) => {
    setAction(actionName);
    setShowModal(true);
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

      <FocusScope handle={menuScope}>
        <MenuItem label="New File" onSelect={() => openDialog('create a new file')} />
        <MenuItem label="Open File" onSelect={() => openDialog('open a file')} />
        <MenuItem label="Save" onSelect={() => openDialog('save current file')} />
        <MenuItem label="Delete" onSelect={() => openDialog('delete a file')} />
        <MenuItem label="Exit" onSelect={() => openDialog('exit the application')} />
      </FocusScope>

      {showModal && (
        <Box>
          <FocusTrap>
            <ConfirmDialog
              title="Confirm Action"
              message={`Are you sure you want to ${action}?`}
              onConfirm={() => {
                setKeyPressCount((c) => c + 1);
                setShowModal(false);
              }}
              onCancel={() => setShowModal(false)}
            />
          </FocusTrap>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>{showModal ? 'Keys outside modal are blocked!' : '↑↓/jk: navigate • enter: select'}</Text>
      </Box>
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
