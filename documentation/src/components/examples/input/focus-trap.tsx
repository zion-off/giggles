'use client';

import { FocusGroup, FocusTrap, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function MenuItem({ label }: { label: string }) {
  const focus = useFocus();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}{label}
    </Text>
  );
}

function Modal({ onClose }: { onClose: () => void }) {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold color="yellow">Modal (q to close)</Text>
      <FocusGroup direction="vertical" keybindings={{ q: onClose }}>
        <MenuItem label="Confirm" />
        <MenuItem label="Cancel" />
      </FocusGroup>
    </Box>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <Box flexDirection="column">
      <FocusGroup direction="vertical" keybindings={{ m: () => setShowModal(true) }}>
        <MenuItem label="New File" />
        <MenuItem label="Open File" />
        <MenuItem label="Save" />
      </FocusGroup>
      <Text dimColor>m to open modal</Text>
      {showModal && (
        <FocusTrap>
          <Modal onClose={() => setShowModal(false)} />
        </FocusTrap>
      )}
    </Box>
  );
}

export default function FocusTrapExample() {
  return (
    <GigglesProvider>
      <App />
    </GigglesProvider>
  );
}
