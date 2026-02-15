'use client';

import { FocusGroup, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';

function MenuItem({ label }: { label: string }) {
  const focus = useFocus();

  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
    </Text>
  );
}

function App() {
  return (
    <Box flexDirection="column">
      <Text bold>My Menu (j/k to navigate)</Text>
      <FocusGroup direction="vertical">
        <MenuItem label="Start Game" />
        <MenuItem label="Settings" />
        <MenuItem label="Exit" />
      </FocusGroup>
    </Box>
  );
}

export default function UseFocusExample() {
  return (
    <GigglesProvider>
      <App />
    </GigglesProvider>
  );
}
