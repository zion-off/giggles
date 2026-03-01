'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { TextInput } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ tab: next, 'shift+tab': prev })
  });

  const submit = () => {
    if (name && email && message) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName('');
        setEmail('');
        setMessage('');
      }, 2500);
    }
  };

  if (submitted) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round" borderColor="green" gap={1}>
        <Text color="green" bold>
          ✓ Submitted
        </Text>
        <Box flexDirection="column">
          <Text dimColor>Name: {name}</Text>
          <Text dimColor>Email: {email}</Text>
          <Text dimColor>Message: {message}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Contact Form</Text>
      <FocusScope handle={scope}>
        <TextInput label="Name:    " value={name} onChange={setName} placeholder="Jane Doe" />
        <TextInput label="Email:   " value={email} onChange={setEmail} placeholder="jane@example.com" />
        <TextInput
          label="Message: "
          value={message}
          onChange={setMessage}
          onSubmit={submit}
          placeholder="Your message..."
        />
      </FocusScope>
      <Text dimColor>Tab / Shift+Tab to switch fields · Enter on last field to submit</Text>
    </Box>
  );
}

export default function TextInputExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <ContactForm />
    </GigglesProvider>
  );
}
