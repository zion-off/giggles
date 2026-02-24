'use client';

import { GigglesProvider, useTheme } from 'giggles';
import { TextInput } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import { useState } from 'react';

function SearchBar() {
  const [query, setQuery] = useState('');
  const { borderStyle } = useTheme();

  return (
    <TextInput
      value={query}
      onChange={setQuery}
      placeholder="Search components..."
      render={({ before, cursorChar, after, focused, value, placeholder }) => {
        const empty = value.length === 0;

        let content;
        if (focused && empty && placeholder) {
          content = (
            <Text>
              <Text inverse>{placeholder[0]}</Text>
              <Text dimColor>{placeholder.slice(1)}</Text>
            </Text>
          );
        } else if (focused) {
          content = (
            <Text>
              {before}
              <Text inverse>{cursorChar}</Text>
              {after}
            </Text>
          );
        } else if (empty && placeholder) {
          content = <Text dimColor>{placeholder}</Text>;
        } else {
          content = <Text>{value}</Text>;
        }

        return (
          <Box borderStyle={borderStyle} borderColor={focused ? 'cyan' : 'gray'} paddingX={1} gap={1} width={36}>
            <Text color={focused ? 'cyan' : 'gray'}>/</Text>
            {content}
          </Box>
        );
      }}
    />
  );
}

export default function TextInputCustomExample() {
  return (
    <GigglesProvider fullScreen={false}>
      <Box paddingX={2} paddingY={1}>
        <SearchBar />
      </Box>
    </GigglesProvider>
  );
}
