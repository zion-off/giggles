'use client';

import { FocusGroup, GigglesProvider, useFocus, useFocusNode } from 'giggles';
import { Box, Text } from 'ink-web';

const FILES = ['index.ts', 'utils.ts', 'types.ts'];
const BRANCHES = ['main', 'feature/dark-mode', 'fix/auth-leak'];

function Item({ label }: { label: string }) {
  const focus = useFocusNode();
  return (
    <Text color={focus.focused ? 'green' : 'white'}>
      {focus.focused ? '> ' : '  '}
      {label}
    </Text>
  );
}

function PanelContent({ title, items }: { title: string; items: string[] }) {
  const { focused } = useFocus();
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={focused ? 'green' : 'white'} paddingX={1} width={24}>
      <Text bold color={focused ? 'green' : 'white'}>{title}</Text>
      <FocusGroup keybindings={({ next, prev }) => ({ j: next, k: prev, down: next, up: prev })}>
        {items.map((item) => (
          <Item key={item} label={item} />
        ))}
      </FocusGroup>
    </Box>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <FocusGroup>
      <PanelContent title={title} items={items} />
    </FocusGroup>
  );
}

function App() {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusGroup keybindings={({ next, prev }) => ({ l: next, h: prev, right: next, left: prev })}>
        <Box flexDirection="row" gap={1}>
          <Panel title="Files" items={FILES} />
          <Panel title="Branches" items={BRANCHES} />
        </Box>
      </FocusGroup>
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
