'use client';

import { GigglesProvider } from 'giggles';
import { Autocomplete } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

const countries = [
  { label: 'Argentina', value: 'ar' },
  { label: 'Australia', value: 'au' },
  { label: 'Brazil', value: 'br' },
  { label: 'Canada', value: 'ca' },
  { label: 'France', value: 'fr' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'United Kingdom', value: 'gb' },
  { label: 'United States', value: 'us' }
];

function Demo() {
  const [country, setCountry] = useState('us');

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Autocomplete
        label="Country:"
        placeholder="Search..."
        options={countries}
        value={country}
        onChange={setCountry}
      />
      <Text dimColor>Selected: {country}</Text>
    </Box>
  );
}

export default function AutocompleteExample() {
  return (
    <GigglesProvider>
      <Demo />
    </GigglesProvider>
  );
}
