import { Box, Text, render } from 'ink';
import { FocusGroup, GigglesProvider, useFocus, useKeybindings } from '../src';
import { MenuItem } from './components/MenuItem';

function Menu() {
  const focus = useFocus();

  useKeybindings(focus, {
    q: () => process.exit(0)
  });

  return (
    <Box flexDirection="column">
      <Text bold>Test Menu (j/k to navigate, enter to select, q to quit)</Text>
      <Text> </Text>
      <FocusGroup direction="vertical">
        <MenuItem label="Option 1" />
        <MenuItem label="Option 2" />
        <MenuItem label="Option 3" />
      </FocusGroup>
    </Box>
  );
}

function App() {
  return (
    <GigglesProvider>
      <Menu />
    </GigglesProvider>
  );
}

render(<App />);
