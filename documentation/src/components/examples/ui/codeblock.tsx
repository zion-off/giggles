'use client';

import { GigglesProvider } from 'giggles';
import { CodeBlock } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import 'prismjs/components/prism-typescript';

const code = `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  const message = \`Hello, \${user.name}!\`;
  return message;
}`;

function App() {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
      <Text bold>TypeScript</Text>
      <CodeBlock language="typescript">{code}</CodeBlock>
    </Box>
  );
}

export default function CodeBlockExample() {
  return (
    <GigglesProvider>
      <App />
    </GigglesProvider>
  );
}
