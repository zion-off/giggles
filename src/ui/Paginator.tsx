import { Box, Text } from 'ink';

type PaginatorStyle = 'arrows' | 'scrollbar' | 'counter';

type PaginatorProps = {
  total: number;
  offset: number;
  visible: number;
  style?: PaginatorStyle;
  position?: 'above' | 'below';
};

export type { PaginatorStyle };

export function Paginator({ total, offset, visible, style = 'arrows', position }: PaginatorProps) {
  if (total <= visible) return null;

  const hasAbove = offset > 0;
  const hasBelow = offset + visible < total;

  if (style === 'arrows') {
    if (position === 'above' && hasAbove) return <Text dimColor>↑</Text>;
    if (position === 'below' && hasBelow) return <Text dimColor>↓</Text>;
    return null;
  }

  if (style === 'counter') {
    if (position === 'above') return null;
    return (
      <Text dimColor>
        {offset + 1}–{Math.min(offset + visible, total)} of {total}
      </Text>
    );
  }

  // style === 'scrollbar'
  const thumbSize = Math.max(1, Math.round((visible / total) * visible));
  const maxThumbOffset = visible - thumbSize;
  const maxScrollOffset = total - visible;
  const thumbOffset = maxScrollOffset === 0 ? 0 : Math.round((offset / maxScrollOffset) * maxThumbOffset);

  return (
    <Box flexDirection="column">
      {Array.from({ length: visible }, (_, i) => {
        const isThumb = i >= thumbOffset && i < thumbOffset + thumbSize;
        return (
          <Text key={i} dimColor={!isThumb}>
            {isThumb ? '█' : '│'}
          </Text>
        );
      })}
    </Box>
  );
}
