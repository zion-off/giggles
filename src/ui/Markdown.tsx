import Table from 'cli-table3';
import { type Token, type Tokens, marked } from 'marked';
import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { useTheme } from '../core/theme';
import { CodeBlock } from './CodeBlock';

type MarkdownProps = {
  children: string;
};

export function Markdown({ children }: MarkdownProps) {
  const tokens = useMemo(() => marked.lexer(children), [children]);
  return (
    <Box flexDirection="column">
      {tokens.map((token, idx) => (
        <TokenRenderer key={idx} token={token} />
      ))}
    </Box>
  );
}

function TokenRenderer({ token }: { token: Token }) {
  const theme = useTheme();

  switch (token.type) {
    case 'heading':
      return (
        <Box marginTop={token.depth === 1 ? 0 : 1}>
          <Text bold underline={token.depth === 1}>
            {renderInline(token.tokens, theme)}
          </Text>
        </Box>
      );

    case 'paragraph': {
      const hasLinks = token.tokens?.some(
        (t: Token) =>
          t.type === 'link' ||
          (t.type === 'strong' && 'tokens' in t && t.tokens?.some((st: Token) => st.type === 'link'))
      );
      if (hasLinks) {
        return (
          <Box flexDirection="row" flexWrap="wrap">
            {renderInline(token.tokens, theme)}
          </Box>
        );
      }
      return <Text>{renderInline(token.tokens, theme)}</Text>;
    }

    case 'code':
      return (
        <Box marginY={1}>
          <CodeBlock language={token.lang || undefined}>{token.text}</CodeBlock>
        </Box>
      );

    case 'blockquote':
      return (
        <Box marginY={1}>
          <Text color={theme.borderColor}>│ </Text>
          <Text dimColor>
            {token.tokens?.map((t: Token, idx: number) => (
              <TokenRenderer key={idx} token={t} />
            ))}
          </Text>
        </Box>
      );

    case 'list':
      return (
        <Box flexDirection="column" marginY={1}>
          {token.items.map((item: Tokens.ListItem, idx: number) => (
            <Box key={idx}>
              <Text>
                {token.ordered
                  ? `${idx + 1}. `
                  : item.checked === true
                  ? `${theme.checkedIndicator} `
                  : item.checked === false
                  ? `${theme.uncheckedIndicator} `
                  : `${theme.indicator} `}
              </Text>
              <Box flexDirection="column">
                {item.tokens.map((t: Token, i: number) => (
                  <TokenRenderer key={i} token={t} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      );

    case 'html': {
      const stripped = (token as Tokens.HTML).text.replace(/<[^>]*>/g, '').trim();
      return stripped ? <Text dimColor>{stripped}</Text> : null;
    }

    case 'table':
      return <TableRenderer token={token as Tokens.Table} />;

    case 'hr':
      return <Text dimColor>{'─'.repeat(40)}</Text>;

    case 'text': {
      const textToken = token as Tokens.Text;
      if (textToken.tokens && textToken.tokens.length > 0) {
        return <Text>{renderInline(textToken.tokens, theme)}</Text>;
      }
      return <Text>{textToken.text}</Text>;
    }

    case 'space':
      return null;

    default:
      if ('text' in token && typeof token.text === 'string') {
        return <Text>{token.text}</Text>;
      }
      return null;
  }
}

function TableRenderer({ token }: { token: Tokens.Table }) {
  const table = new Table({
    head: token.header.map((cell) => renderInlineToString(cell.tokens)),
    style: { head: [], border: [] }
  });

  for (const row of token.rows) {
    table.push(row.map((cell) => renderInlineToString(cell.tokens)));
  }

  return <Text>{table.toString()}</Text>;
}

function renderInline(tokens: Token[] | undefined, theme: ReturnType<typeof useTheme>): React.ReactNode {
  if (!tokens) return null;

  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'text':
        return <Text key={idx}>{token.text}</Text>;

      case 'strong':
        return (
          <Text key={idx} bold>
            {renderInline(token.tokens, theme)}
          </Text>
        );

      case 'em':
        return (
          <Text key={idx} italic>
            {renderInline(token.tokens, theme)}
          </Text>
        );

      case 'codespan':
        return (
          <Text key={idx} color={theme.accentColor}>
            `{token.text}`
          </Text>
        );

      case 'link':
        return (
          <Link key={idx} url={token.href}>
            <Text color={theme.accentColor}>{renderInlineToString(token.tokens)}</Text>
          </Link>
        );

      case 'image':
        return (
          <Text key={idx} color={theme.accentColor}>
            [Image: {token.text || token.href}]
          </Text>
        );

      case 'escape':
        return <Text key={idx}>{token.text}</Text>;

      case 'html': {
        const stripped = (token as Tokens.Tag).text.replace(/<[^>]*>/g, '');
        return stripped ? <Text key={idx}>{stripped}</Text> : null;
      }

      case 'br':
        return <Text key={idx}>{'\n'}</Text>;

      case 'del':
        return (
          <Text key={idx} strikethrough>
            {renderInline(token.tokens, theme)}
          </Text>
        );

      default:
        if ('text' in token && typeof token.text === 'string') {
          return <Text key={idx}>{token.text}</Text>;
        }
        return null;
    }
  });
}

function renderInlineToString(tokens: Token[] | undefined): string {
  if (!tokens) return '';

  return tokens
    .map((token) => {
      if ('text' in token && typeof token.text === 'string') {
        return token.text;
      }
      if ('tokens' in token && Array.isArray(token.tokens)) {
        return renderInlineToString(token.tokens);
      }
      return '';
    })
    .join('');
}
