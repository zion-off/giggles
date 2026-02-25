'use client';

import { GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { Modal, Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const items = [
  { label: 'New File', value: 'new' },
  { label: 'Open File', value: 'open' },
  { label: 'Settings', value: 'settings' }
];

function App() {
  const focus = useFocusNode();
  const [showModal, setShowModal] = useState(false);
  const [choice, setChoice] = useState('new');

  useKeybindings(focus, {
    m: { action: () => setShowModal(true), name: 'Open modal' }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Select options={items} value={choice} onChange={setChoice} />
      {showModal && (
        <Modal title="Details" onClose={() => setShowModal(false)}>
          <Text>You selected: {choice}</Text>
        </Modal>
      )}
      <Text dimColor>m to open modal, Escape to close</Text>
    </Box>
  );
}

export default function ModalExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
