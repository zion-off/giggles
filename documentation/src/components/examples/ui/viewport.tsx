'use client';

import { FocusScope, GigglesProvider, useFocusScope, useTheme } from 'giggles';
import { Viewport } from 'giggles/ui';
import { Box, Text } from 'ink-web';

const paragraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
  'Ut labore et dolore magnam aliquam quaerat voluptatem animi et quasi architecto beatae vitae dicta.'
];

function Demo() {
  const scope = useFocusScope();
  const { borderColor } = useTheme();

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <FocusScope handle={scope}>
        <Viewport height={8} borderStyle="round" borderColor={borderColor}>
          {paragraphs.map((p, i) => (
            <Text key={i}>{p}</Text>
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
