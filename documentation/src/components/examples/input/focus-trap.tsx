'use client';

import { FocusGroup, FocusTrap, GigglesProvider, useFocusNode } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
    </Text>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold color="yellow">
        Modal (q to close)
      </Text>
      <FocusGroup keybindings={({ next, prev }) => ({ j: next, k: prev, down: next, up: prev, q: onClose })}>
        <MenuItem label="Confirm" />
        <MenuItem label="Cancel" />
      </FocusGroup>
    </Box>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusGroup
        keybindings={({ next, prev }) => ({ j: next, k: prev, down: next, up: prev, m: () => setShowModal(true) })}
      >
        <MenuItem label="New File" />
        <MenuItem label="Open File" />
        <MenuItem label="Save" />
      </FocusGroup>
      {showModal && (
        <FocusTrap>
          <Modal onClose={() => setShowModal(false)} />
        </FocusTrap>
      )}
      <Text dimColor>m to open modal</Text>
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
