'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { TextInput } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Form() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ tab: next, 'shift+tab': prev })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={scope}>
        <TextInput label="Username:" value={username} onChange={setUsername} placeholder="john_doe" />
        <TextInput label="Email:   " value={email} onChange={setEmail} placeholder="john@example.com" />
      </FocusScope>
      <Text dimColor>Tab / Shift+Tab to switch fields</Text>
    </Box>
  );
}

export default function TextInputExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Form />
    </GigglesProvider>
  );
}
