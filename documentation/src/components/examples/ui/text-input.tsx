'use client';

import { FocusGroup, GigglesProvider } from 'giggles';
import { TextInput } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Form() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusGroup direction="vertical">
        <TextInput label="Username:" value={username} onChange={setUsername} placeholder="john_doe" />
        <TextInput label="Email:   " value={email} onChange={setEmail} placeholder="john@example.com" />
      </FocusGroup>
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
