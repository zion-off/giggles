'use client';

import { FocusScope, GigglesProvider, Router, Screen, useFocusScope, useNavigation } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const FILES = ['index.ts', 'utils.ts', 'types.ts'];
const RESULTS = ['useNavigation', 'useKeybindings', 'useFocusNode'];

function Files() {
  const nav = useNavigation();
  const scope = useFocusScope({
    keybindings: () => ({
      l: () => nav.push('search')
    })
  });

  return (
    <FocusScope handle={scope}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Box gap={2}>
          <Text bold color="green">
            ● Files
          </Text>
          <Text color="grey">○ Search</Text>
        </Box>
        <Select options={FILES.map((f) => ({ label: f, value: f }))} />
        <Text dimColor>l: search</Text>
      </Box>
    </FocusScope>
  );
}

function Search() {
  const nav = useNavigation();
  const scope = useFocusScope({
    keybindings: () => ({
      h: () => nav.pop()
    })
  });

  return (
    <FocusScope handle={scope}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <Box gap={2}>
          <Text color="grey">○ Files</Text>
          <Text bold color="green">
            ● Search
          </Text>
        </Box>
        <Select options={RESULTS.map((r) => ({ label: r, value: r }))} />
        <Text dimColor>h: files</Text>
      </Box>
    </FocusScope>
  );
}

function Tabs() {
  return (
    <Router initialScreen="files">
      <Screen name="files" component={Files} />
      <Screen name="search" component={Search} />
    </Router>
  );
}

export default function NestedRouterExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Router initialScreen="tabs">
        <Screen name="tabs" component={Tabs} />
      </Router>
    </GigglesProvider>
  );
}
