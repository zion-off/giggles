'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { Select } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const PANELS = [
  { key: 'editor', shortcut: '1', title: 'Editor', items: ['index.ts', 'utils.ts', 'types.ts'] },
  { key: 'terminal', shortcut: '2', title: 'Terminal', items: ['bash', 'zsh', 'fish'] },
  { key: 'sidebar', shortcut: '3', title: 'Sidebar', items: ['Files', 'Search', 'Git'] }
];

function Panel({
  focusKey,
  shortcut,
  title,
  items
}: {
  focusKey: string;
  shortcut: string;
  title: string;
  items: string[];
}) {
  const scope = useFocusScope({ focusKey });

  return (
    <FocusScope handle={scope}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={scope.hasFocus ? 'green' : 'grey'}
        paddingX={1}
        width={18}
      >
        <Text bold color={scope.hasFocus ? 'white' : 'grey'}>
          <Text color={scope.hasFocus ? 'green' : 'grey'}>{shortcut}</Text> {title}
        </Text>
        <Select options={items.map((i) => ({ label: i, value: i }))} />
      </Box>
    </FocusScope>
  );
}

function App() {
  const root = useFocusScope({
    keybindings: ({ focusChild }) => ({
      '1': () => focusChild('editor'),
      '2': () => focusChild('terminal'),
      '3': () => focusChild('sidebar')
    })
  });

  return (
    <FocusScope handle={root}>
      <Box gap={2}>
        {PANELS.map((p) => (
          <Panel key={p.key} focusKey={p.key} shortcut={p.shortcut} title={p.title} items={p.items} />
        ))}
      </Box>
    </FocusScope>
  );
}

export default function FocusChildExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
        <App />
        <Text dimColor>1 / 2 / 3: jump to panel · j/k: navigate items</Text>
      </Box>
    </GigglesProvider>
  );
}
