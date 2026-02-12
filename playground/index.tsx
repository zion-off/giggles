import React from 'react';
import { Box, Text, render } from 'ink';

function App() {
  return (
    <Box flexDirection="column">
      <Text bold>giggles playground</Text>
      <Text dimColor>import from ../src and test here</Text>
    </Box>
  );
}

render(<App />);
