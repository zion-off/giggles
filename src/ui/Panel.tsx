import React, { useState } from 'react';
import { Box, Text, measureElement } from 'ink';
import { useTheme } from '../core/theme';

export type PanelProps = {
  children: React.ReactNode;
  title?: string;
  width?: number;
  borderColor?: string;
  footer?: React.ReactNode;
};

export function Panel({ children, title, width, borderColor, footer }: PanelProps) {
  const theme = useTheme();
  const color = borderColor ?? theme.borderColor;
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const effectiveWidth = width ?? measuredWidth;

  const renderTopBorder = () => {
    if (effectiveWidth === 0) return null;

    if (title == null) {
      return <Text color={color}>╭{'─'.repeat(Math.max(0, effectiveWidth - 2))}╮</Text>;
    }

    const maxTitleWidth = Math.max(0, effectiveWidth - 5); // ╭ + space + space + ─ + ╮
    const displayTitle = title.length > maxTitleWidth ? title.slice(0, maxTitleWidth - 1) + '…' : title;
    const titlePart = `╭ ${displayTitle} `;
    const totalDashes = Math.max(1, effectiveWidth - titlePart.length - 1);

    return (
      <Text>
        <Text color={color}>╭ </Text>
        <Text color={color} bold>
          {displayTitle}
        </Text>
        <Text color={color}> {'─'.repeat(totalDashes)}╮</Text>
      </Text>
    );
  };

  return (
    <Box
      flexDirection="column"
      width={width}
      flexGrow={width == null ? 1 : undefined}
      ref={(node) => {
        if (node) {
          const { width: w } = measureElement(node);
          if (w !== measuredWidth) setMeasuredWidth(w);
        }
      }}
    >
      {renderTopBorder()}
      <Box flexDirection="column" flexGrow={1} borderStyle="round" borderTop={false} borderColor={color} paddingX={1}>
        {footer ? (
          <>
            <Box flexDirection="column" flexGrow={1}>
              {children}
            </Box>
            {footer}
          </>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
