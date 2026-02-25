'use client';

import { GigglesProvider, useFocusNode, useKeybindings } from 'giggles';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

function ContactForm() {
  const focus = useFocusNode();
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [activeField, setActiveField] = useState<keyof FormData>('name');
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fields: Array<{ key: keyof FormData; label: string; placeholder: string }> = [
    { key: 'name', label: 'Name', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com' },
    { key: 'message', label: 'Message', placeholder: 'Your message here...' }
  ];

  const currentIndex = fields.findIndex((f) => f.key === activeField);

  const submit = () => {
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', message: '' });
        setActiveField('name');
      }, 3000);
    }
  };

  // Navigation keybindings — disabled while editing so they don't intercept
  // typed characters before the fallback handler sees them
  useKeybindings(focus, {
    ...(!editing && {
      j: () => setActiveField(fields[Math.min(currentIndex + 1, fields.length - 1)].key),
      k: () => setActiveField(fields[Math.max(currentIndex - 1, 0)].key),
      down: () => setActiveField(fields[Math.min(currentIndex + 1, fields.length - 1)].key),
      up: () => setActiveField(fields[Math.max(currentIndex - 1, 0)].key),
      enter: () => setEditing(true)
    }),
    'ctrl+s': submit,
    escape: () => setEditing(false)
  });

  // Text input — when editing, fallback intercepts all keys except bubble list
  useKeybindings(
    focus,
    editing
      ? {
          enter: () => {
            setEditing(false);
            if (currentIndex < fields.length - 1) {
              setActiveField(fields[currentIndex + 1].key);
            }
          }
        }
      : {},
    editing
      ? {
          fallback: (input, key) => {
            if (key.backspace || key.delete) {
              setFormData((prev) => ({
                ...prev,
                [activeField]: prev[activeField].slice(0, -1)
              }));
            } else if (!key.ctrl && !key.meta && input) {
              setFormData((prev) => ({
                ...prev,
                [activeField]: prev[activeField] + input
              }));
            }
          },
          bubble: ['escape', 'enter', 'ctrl+s']
        }
      : undefined
  );

  if (submitted) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1} borderStyle="round" borderColor="green">
        <Text color="green" bold>
          ✓ Form submitted successfully!
        </Text>
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Name: {formData.name}</Text>
          <Text dimColor>Email: {formData.email}</Text>
          <Text dimColor>Message: {formData.message}</Text>
        </Box>
      </Box>
    );
  }

  const isFormValid = formData.name && formData.email && formData.message;

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold color="cyan">
        Contact Form
      </Text>

      <Box flexDirection="column" gap={1} marginTop={1}>
        {fields.map((field) => {
          const isActive = field.key === activeField;
          const value = formData[field.key];
          const isEditingThis = editing && isActive;

          return (
            <Box key={field.key} flexDirection="column">
              <Text color={isActive ? 'yellow' : 'grey'}>{field.label}:</Text>
              <Box>
                <Text color={isActive ? 'white' : 'grey'}>
                  {isActive ? '▸ ' : '  '}
                  {value || <Text dimColor>{field.placeholder}</Text>}
                  {isEditingThis && <Text color="green">█</Text>}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1} gap={0}>
        <Text dimColor>
          {editing
            ? 'Type to edit • esc: cancel • enter: next field'
            : '↑↓/jk: navigate • enter: edit • ctrl+s: submit'}
        </Text>
        {!isFormValid && (
          <Text color="red" dimColor>
            All fields required
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default function CaptureModeExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <ContactForm />
    </GigglesProvider>
  );
}
