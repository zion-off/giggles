import React from 'react';
import { Box, type BoxProps, Text } from 'ink';
import { useTheme } from '../core/theme';
import Prism from 'prismjs';

export type TokenColors = {
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  operator: string;
  punctuation: string;
  builtin: string;
  className: string;
  variable: string;
  property: string;
  regex: string;
  inserted: string;
  deleted: string;
};

const defaultTokenColors: TokenColors = {
  keyword: '#C678DD',
  string: '#98C379',
  number: '#D19A66',
  comment: '#5C6370',
  function: '#61AFEF',
  operator: '#56B6C2',
  punctuation: '#ABB2BF',
  builtin: '#E5C07B',
  className: '#E5C07B',
  variable: '#E06C75',
  property: '#E06C75',
  regex: '#98C379',
  inserted: '#98C379',
  deleted: '#E06C75'
};

type CodeBlockProps = Omit<BoxProps, 'children'> & {
  children: string;
  language?: string;
  tokenColors?: Partial<TokenColors>;
};

export function CodeBlock({ children, language, tokenColors, ...boxProps }: CodeBlockProps) {
  const theme = useTheme();
  const colors = { ...defaultTokenColors, ...tokenColors };
  const grammar = language ? Prism.languages[language] : undefined;

  const content = grammar ? renderTokens(Prism.tokenize(children, grammar), colors) : <Text>{children}</Text>;

  return (
    <Box paddingX={1} borderStyle="round" borderColor={theme.borderColor} {...boxProps}>
      <Text>{content}</Text>
    </Box>
  );
}

function renderTokens(tokens: Array<string | Prism.Token>, colors: TokenColors): React.ReactNode {
  return tokens.map((token, idx) => {
    if (typeof token === 'string') {
      return <Text key={idx}>{token}</Text>;
    }

    const color = getTokenColor(token.type, colors);
    const content = Array.isArray(token.content)
      ? renderTokens(token.content, colors)
      : typeof token.content === 'string'
      ? token.content
      : renderTokens([token.content], colors);

    return color ? (
      <Text key={idx} color={color}>
        {content}
      </Text>
    ) : (
      <Text key={idx}>{content}</Text>
    );
  });
}

function getTokenColor(type: string, colors: TokenColors): string | undefined {
  switch (type) {
    case 'keyword':
    case 'tag':
    case 'boolean':
    case 'important':
      return colors.keyword;
    case 'string':
    case 'char':
    case 'template-string':
    case 'attr-value':
      return colors.string;
    case 'number':
      return colors.number;
    case 'comment':
    case 'prolog':
    case 'doctype':
    case 'cdata':
      return colors.comment;
    case 'function':
    case 'function-variable':
      return colors.function;
    case 'operator':
    case 'arrow':
      return colors.operator;
    case 'punctuation':
      return colors.punctuation;
    case 'builtin':
    case 'constant':
    case 'symbol':
      return colors.builtin;
    case 'class-name':
    case 'maybe-class-name':
    case 'namespace':
      return colors.className;
    case 'variable':
      return colors.variable;
    case 'property':
    case 'string-property':
      return colors.property;
    case 'regex':
    case 'regex-source':
    case 'regex-delimiter':
    case 'regex-flags':
      return colors.regex;
    case 'url':
      return colors.string;
    case 'attr-name':
      return colors.function;
    case 'entity':
      return colors.builtin;
    case 'atrule':
      return colors.keyword;
    case 'selector':
      return colors.className;
    case 'bold':
    case 'italic':
      return colors.keyword;
    case 'inserted-sign':
    case 'inserted':
      return colors.inserted;
    case 'deleted-sign':
    case 'deleted':
      return colors.deleted;
    case 'unchanged':
      return colors.comment;
    default:
      return undefined;
  }
}
