import { GigglesProvider } from 'giggles';
import { Select } from 'giggles/ui';
import { useState } from 'react';
import { Box, Text, render } from 'ink';

const menuItems = [
  { label: 'New Game', value: 'new' },
  { label: 'Continue', value: 'continue' },
  { label: 'Settings', value: 'settings' },
  { label: 'Quit', value: 'quit' }
];

function App() {
  const [choice, setChoice] = useState('new');

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>My App</Text>
      <Select options={menuItems} value={choice} onChange={setChoice} />
      <Text dimColor>Selected: {choice}</Text>
    </Box>
  );
}

render(
  <GigglesProvider>
    <App />
  </GigglesProvider>
);
