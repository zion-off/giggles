'use client';

import { FocusGroup, GigglesProvider, useFocus } from 'giggles';
import { Box, Text } from 'ink-web';

function Tab({ label }: { label: string }) {
  const focus = useFocus();
  return (
    <Box paddingX={1}>
      <Text bold={focus.focused} underline={focus.focused} color={focus.focused ? 'green' : 'white'}>
        {label}
      </Text>
    </Box>
  );
}

export default function HorizontalTabsExample() {
  return (
    <GigglesProvider>
      <Box flexDirection="column">
        <Text bold>Tabs (h/l to navigate)</Text>
        <Box>
          <FocusGroup direction="horizontal">
            <Tab label="General" />
            <Tab label="Keybindings" />
            <Tab label="Appearance" />
          </FocusGroup>
        </Box>
      </Box>
    </GigglesProvider>
  );
}
