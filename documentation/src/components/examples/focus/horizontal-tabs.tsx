'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope } from 'giggles';
import { Box, Text } from 'ink-web';

function Tab({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Box paddingX={1}>
      <Text bold={focus.hasFocus} underline={focus.hasFocus} color={focus.hasFocus ? 'green' : 'white'}>
        {label}
      </Text>
    </Box>
  );
}

function TabBar() {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ h: prev, l: next, left: prev, right: next })
  });

  return (
    <FocusScope handle={scope}>
      <Box>
        <Tab label="General" />
        <Tab label="Keybindings" />
        <Tab label="Appearance" />
      </Box>
    </FocusScope>
  );
}

export default function HorizontalTabsExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Text bold>Tabs</Text>
        <TabBar />
        <Text dimColor>h/l to navigate</Text>
      </Box>
    </GigglesProvider>
  );
}
