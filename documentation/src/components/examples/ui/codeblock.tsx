'use client';

import { GigglesProvider } from 'giggles';
import { CodeBlock } from 'giggles/ui';
import { Box, Text } from 'ink-web';
import 'prismjs/components/prism-typescript';

const code = `
import { CodeBlock } from 'giggles/ui';
import 'prismjs/components/prism-typescript';

function Preview() {
  const code = \`const x: number = 42;\`;

  return <CodeBlock language="typescript">{code}</CodeBlock>;
}
`;

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
    <GigglesProvider fullScreen={false}>
      <App />
    </GigglesProvider>
  );
}
