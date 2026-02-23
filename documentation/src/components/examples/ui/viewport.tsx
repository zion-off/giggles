'use client';

import { FocusScope, GigglesProvider, useFocusScope } from 'giggles';
import { Viewport } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const lines = Array.from(
  { length: 30 },
  (_, i) =>
    `Line ${i + 1}: ${
      [
        'Lorem ipsum dolor sit amet',
        'Sed do eiusmod tempor incididunt',
        'Ut enim ad minim veniam',
        'Duis aute irure dolor in reprehenderit',
        'Excepteur sint occaecat cupidatat'
      ][i % 5]
    }`
);

function Demo() {
  const scope = useFocusScope();

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={scope}>
        <Viewport height={8}>
          {lines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Viewport>
      </FocusScope>
      <Text dimColor>j/k to scroll, g/G for top/bottom</Text>
    </Box>
  );
}

export default function ViewportExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Demo />
    </GigglesProvider>
  );
}
