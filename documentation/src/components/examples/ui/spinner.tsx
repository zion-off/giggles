'use client';

import { GigglesProvider } from 'giggles';
import { Spinner, spinners } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const presets = [
  ['line', spinners.line],
  ['dot', spinners.dot],
  ['miniDot', spinners.miniDot],
  ['jump', spinners.jump],
  ['pulse', spinners.pulse],
  ['points', spinners.points],
  ['clock', spinners.clock],
  ['hearts', spinners.hearts],
  ['moon', spinners.moon],
  ['meter', spinners.meter],
  ['hamburger', spinners.hamburger],
  ['ellipsis', spinners.ellipsis]
] as const;

const left = presets.filter((_, i) => i % 2 === 0);
const right = presets.filter((_, i) => i % 2 === 1);

function Column({ items }: { items: typeof left }) {
  return (
    <Box flexDirection="column" gap={0}>
      {items.map(([name, def]) => (
        <Box key={name} gap={2}>
          <Spinner spinner={def} />
          <Text dimColor>{name}</Text>
        </Box>
      ))}
    </Box>
  );
}

function App() {
  return (
    <Box paddingX={2} paddingY={1} gap={4}>
      <Column items={left} />
      <Column items={right} />
    </Box>
  );
}

export default function SpinnerExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
