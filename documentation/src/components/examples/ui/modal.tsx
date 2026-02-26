'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { Modal, Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const items = [
  { label: 'New File', value: 'new' },
  { label: 'Open File', value: 'open' },
  { label: 'Settings', value: 'settings' }
];

function App() {
  const [showModal, setShowModal] = useState(false);
  const [choice, setChoice] = useState('new');

  const scope = useFocusScope({
    keybindings: {
      m: { action: () => setShowModal(true), name: 'Open modal' }
    }
  });

  return (
    <FocusScope handle={scope}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Select options={items} value={choice} onChange={setChoice} />
        {showModal && (
          <Modal title="Details" onClose={() => setShowModal(false)}>
            <Text>You selected: {choice}</Text>
          </Modal>
        )}
        <Text dimColor>m to open modal, Escape to close</Text>
      </Box>
    </FocusScope>
  );
}

export default function ModalExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
