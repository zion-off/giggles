'use client';

import { GigglesProvider } from 'giggles';
import { Confirm } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Demo() {
  const [answer, setAnswer] = useState<boolean | null>(null);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      {answer == null ? (
        <Confirm message="Delete this file?" onSubmit={setAnswer} />
      ) : (
        <Text dimColor>Answered: {answer ? 'Yes' : 'No'}</Text>
      )}
    </Box>
  );
}

export default function ConfirmExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Demo />
    </GigglesProvider>
  );
}
