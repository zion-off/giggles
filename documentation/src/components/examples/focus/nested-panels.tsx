'use client';

import { FocusScope, GigglesProvider, useFocusNode, useFocusScope } from 'giggles';
import { Box, Text } from 'ink-web';

const FILES = ['index.ts', 'utils.ts', 'types.ts'];
const BRANCHES = ['main', 'feature/dark-mode', 'fix/auth-leak'];

function Item({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.hasFocus ? 'green' : 'white'}>
      {focus.hasFocus ? '> ' : '  '}
      {label}
    </Text>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  const scope = useFocusScope({
    keybindings: ({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={scope.hasFocus ? 'green' : 'white'}
      paddingX={1}
      width={24}
    >
      <Text bold color={scope.hasFocus ? 'green' : 'white'}>
        {title}
      </Text>
      <FocusScope handle={scope}>
        {items.map((item) => (
          <Item key={item} label={item} />
        ))}
      </FocusScope>
    </Box>
  );
}

function App() {
  const root = useFocusScope({
    keybindings: ({ nextShallow, prevShallow }) => ({
      l: nextShallow,
      h: prevShallow,
      right: nextShallow,
      left: prevShallow
    })
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={root}>
        <Box flexDirection="row" gap={1}>
          <Panel title="Files" items={FILES} />
          <Panel title="Branches" items={BRANCHES} />
        </Box>
      </FocusScope>
      <Text dimColor>h/l — switch panels · j/k — navigate within panel</Text>
    </Box>
  );
}

export default function NestedPanelsExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
