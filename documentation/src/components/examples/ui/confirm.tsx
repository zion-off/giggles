'use client';

import { GigglesProvider } from 'giggles';
import { Confirm } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function Demo() {
  const [answer, setAnswer] = useState<boolean | null>(null);

  return (
    <Box flexDirection="column" gap={1}>
      {answer == null ? (
        <Confirm message="Delete this file?" onSubmit={setAnswer} />
      ) : (
        <Text>
          Answered: <Text color={answer ? 'green' : 'red'}>{answer ? 'Yes' : 'No'}</Text>
        </Text>
      )}
      <Text dimColor>y/n to answer, Enter for default</Text>
    </Box>
  );
}

export default function ConfirmExample() {
  return (
    <GigglesProvider>
      <Demo />
    </GigglesProvider>
  );
}
