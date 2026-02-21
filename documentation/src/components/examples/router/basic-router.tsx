'use client';

import { GigglesProvider, Router, Screen, useFocus, useKeybindings, useNavigation } from 'giggles';
import { Box, Text } from 'ink-web';

function Home() {
  const { push } = useNavigation();
  const focus = useFocus();

  useKeybindings(focus, {
    s: () => push('settings'),
    d: () => push('detail', { id: 42 })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Home</Text>
      <Text dimColor>s = settings, d = detail</Text>
    </Box>
  );
}

function Settings() {
  const { pop } = useNavigation();
  const focus = useFocus();

  useKeybindings(focus, {
    q: () => pop()
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Settings</Text>
      <Text dimColor>q = back</Text>
    </Box>
  );
}

function Detail() {
  const { pop, currentRoute } = useNavigation();
  const focus = useFocus();

  useKeybindings(focus, {
    q: () => pop()
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>Detail (id: {String(currentRoute.params?.id)})</Text>
      <Text dimColor>q = back</Text>
    </Box>
  );
}

export default function BasicRouterExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Router initialScreen="home">
        <Screen name="home" component={Home} />
        <Screen name="settings" component={Settings} />
        <Screen name="detail" component={Detail} />
      </Router>
    </GigglesProvider>
  );
}
