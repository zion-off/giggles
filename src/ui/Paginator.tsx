import { Box, Text } from 'ink';
import { useTheme } from '../core/theme';

type PaginatorStyle = 'dots' | 'arrows' | 'scrollbar' | 'counter' | 'none';

type PaginatorProps = {
  total: number;
  offset: number;
  visible: number;
  gap?: number;
  style?: PaginatorStyle;
  position?: 'above' | 'below';
};

export type { PaginatorStyle };

export function Paginator({ total, offset, visible, gap = 0, style = 'arrows', position }: PaginatorProps) {
  const theme = useTheme();

  if (style === 'none' || total <= visible) return null;

  const hasAbove = offset > 0;
  const hasBelow = offset + visible < total;

  if (style === 'arrows') {
    if (position === 'above' && hasAbove) return <Text color={theme.accentColor}>↑</Text>;
    if (position === 'below' && hasBelow) return <Text color={theme.accentColor}>↓</Text>;
    return null;
  }

  if (style === 'dots') {
    if (position === 'above') return null;
    const totalPages = Math.ceil(total / visible);
    const maxOffset = Math.max(1, total - visible);
    const currentPage = Math.round((offset / maxOffset) * (totalPages - 1));
    return (
      <Text>
        {Array.from({ length: totalPages }, (_, i) => (
          <Text key={i} dimColor={i !== currentPage}>
            {'●'}
            {i < totalPages - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    );
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
  const totalLines = visible + gap * (visible - 1);
  const thumbSize = Math.max(1, Math.round((visible / total) * totalLines));
  const maxThumbOffset = totalLines - thumbSize;
  const maxScrollOffset = total - visible;
  const thumbOffset = maxScrollOffset === 0 ? 0 : Math.round((offset / maxScrollOffset) * maxThumbOffset);

  return (
    <Box flexDirection="column">
      {Array.from({ length: totalLines }, (_, i) => {
        const isThumb = i >= thumbOffset && i < thumbOffset + thumbSize;
        return (
          <Text key={i} color={isThumb ? theme.accentColor : undefined} dimColor={!isThumb}>
            {isThumb ? '█' : '│'}
          </Text>
        );
      })}
    </Box>
  );
}
