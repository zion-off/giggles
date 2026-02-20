import React, { useEffect, useRef, useState } from 'react';
import { Box } from 'ink';
import { Paginator, type PaginatorStyle } from './Paginator';

export type VirtualListRenderProps<T> = {
  item: T;
  index: number;
};

type VirtualListBase<T> = {
  items: T[];
  gap?: number;
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  render: (props: VirtualListRenderProps<T>) => React.ReactNode;
};

type VirtualListProps<T> = VirtualListBase<T> &
  ({ highlightIndex?: number; scrollOffset?: never } | { highlightIndex?: never; scrollOffset?: number });

export function VirtualList<T>({
  items,
  highlightIndex,
  scrollOffset: controlledOffset,
  gap = 0,
  maxVisible,
  paginatorStyle = 'dots',
  render
}: VirtualListProps<T>) {
  const [internalOffset, setInternalOffset] = useState(0);
  const offsetRef = useRef(0);

  const windowed = maxVisible != null && items.length > maxVisible;

  let offset = 0;
  if (windowed) {
    const maxOffset = Math.max(0, items.length - maxVisible);

    if (controlledOffset != null) {
      offset = Math.min(controlledOffset, maxOffset);
    } else {
      offset = Math.min(internalOffset, maxOffset);

      if (highlightIndex != null && highlightIndex >= 0) {
        if (highlightIndex < offset) {
          offset = highlightIndex;
        } else if (highlightIndex >= offset + maxVisible) {
          offset = highlightIndex - maxVisible + 1;
        }
      }
    }
  }

  offsetRef.current = offset;

  useEffect(() => {
    if (windowed && offsetRef.current !== internalOffset) {
      setInternalOffset(offsetRef.current);
    }
  }, [windowed, highlightIndex, controlledOffset, internalOffset]);

  if (!windowed) {
    return (
      <Box flexDirection="column" gap={gap}>
        {items.map((item, index) => (
          <React.Fragment key={index}>{render({ item, index })}</React.Fragment>
        ))}
      </Box>
    );
  }

  const visible = items.slice(offset, offset + maxVisible);

  const paginatorProps = {
    total: items.length,
    offset,
    visible: maxVisible,
    gap,
    style: paginatorStyle
  };

  if (paginatorStyle === 'scrollbar') {
    return (
      <Box flexDirection="row" gap={1}>
        <Box flexDirection="column" gap={gap} flexGrow={1}>
          {visible.map((item, i) => {
            const index = offset + i;
            return <React.Fragment key={index}>{render({ item, index })}</React.Fragment>;
          })}
        </Box>
        <Paginator {...paginatorProps} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={gap}>
      <Paginator {...paginatorProps} position="above" />
      {visible.map((item, i) => {
        const index = offset + i;
        return <React.Fragment key={index}>{render({ item, index })}</React.Fragment>;
      })}
      <Paginator {...paginatorProps} position="below" />
    </Box>
  );
}
