'use client';

import { FocusGroup, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Field({ id, label }: { id: string; label: string }) {
  const focus = useFocus(id);
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
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
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Form</Text>
      <FocusGroup value={field} navigable={false} keybindings={{ n: advance }}>
        <Field id="name" label="Name" />
        <Field id="email" label="Email" />
        <Field id="submit" label="Submit" />
      </FocusGroup>
      <Text dimColor>n to advance</Text>
    </Box>
  );
}

export default function ControlledFocusExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Form />
    </GigglesProvider>
  );
}
