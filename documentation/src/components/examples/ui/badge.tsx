'use client';

import { GigglesProvider } from 'giggles';
import { Badge } from 'giggles/ui';
import { Box, Text } from 'ink-web';

function App() {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Box gap={1}>
        <Badge variant="plain">info</Badge>
        <Badge variant="plain" background="#E06C75">
          error
        </Badge>
        <Badge variant="plain" background="#E5C07B" color="#1E1E2E">
          warn
        </Badge>
        <Badge variant="plain" background="#98C379">
          ok
        </Badge>
      </Box>
    </Box>
  );
}

export default function BadgeExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
