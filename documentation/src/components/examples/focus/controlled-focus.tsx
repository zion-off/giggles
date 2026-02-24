'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const PANELS = [
  { id: 'nav', title: 'Navigation', items: ['Home', 'About', 'Portfolio', 'Contact'] },
  { id: 'tools', title: 'Tools', items: ['Grep', 'Find', 'Awk', 'Sed'] }
];

function Panel({ title, items }: { title: string; items: string[] }) {
  const scope = useFocusScope({
    keybindings: ({ escape }) => ({ e: escape })
  });

  return (
    <FocusScope handle={scope}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={scope.isPassive ? 'yellow' : scope.hasFocus ? 'green' : 'grey'}
        paddingX={1}
        width={20}
      >
        <Text bold color={scope.hasFocus ? 'white' : 'grey'}>
          {title}
          {scope.isPassive ? ' (escaped)' : ''}
        </Text>
        <Select options={items.map((i) => ({ label: i, value: i }))} />
      </Box>
    </FocusScope>
  );
}

function App() {
  const root = useFocusScope({
    keybindings: ({ next, prev }) => ({ j: next, k: prev })
  });

  return (
    <FocusScope handle={root}>
      <Box gap={2}>
        {PANELS.map((p) => (
          <Panel key={p.id} title={p.title} items={p.items} />
        ))}
      </Box>
    </FocusScope>
  );
}

export default function ControlledFocusExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <App />
        <Text dimColor>j/k: navigate within panel · e: exit · j/k: switch panels</Text>
      </Box>
    </GigglesProvider>
  );
}
