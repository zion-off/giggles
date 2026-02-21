'use client';

import { GigglesProvider } from 'giggles';
import { Panel } from 'giggles/ui';
import { Box, Text } from 'ink-web';

function App() {
  return (
    <Box paddingX={2} paddingY={1}>
      <Panel title="Files" width={30} footer={<Text dimColor>3 items</Text>}>
        <Text>index.ts</Text>
        <Text>utils.ts</Text>
        <Text>types.ts</Text>
      </Panel>
    </Box>
  );
}

export default function PanelExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
