'use client';

import { FocusGroup, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Field({ id, label }: { id: string; label: string }) {
  const focus = useFocus(id);
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}{label}
    </Text>
  );
}

function Form() {
  const [field, setField] = useState('name');

  const advance = () => {
    setField((f) => {
      if (f === 'name') return 'email';
      if (f === 'email') return 'submit';
      return 'name';
    });
  };

  return (
    <Box flexDirection="column">
      <Text bold>Form (n to advance)</Text>
      <FocusGroup value={field} keybindings={{ n: advance }}>
        <Field id="name" label="Name" />
        <Field id="email" label="Email" />
        <Field id="submit" label="Submit" />
      </FocusGroup>
    </Box>
  );
}

export default function ControlledFocusExample() {
  return (
    <GigglesProvider>
      <Form />
    </GigglesProvider>
  );
}
