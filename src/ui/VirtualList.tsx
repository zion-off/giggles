import React, { useState } from 'react';
import { Box } from 'ink';
import { Paginator, type PaginatorStyle } from './Paginator';

export type VirtualListRenderProps<T> = {
  item: T;
  index: number;
};

type VirtualListBase<T> = {
  items: T[];
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
  maxVisible,
  paginatorStyle = 'arrows',
  render
}: VirtualListProps<T>) {
  const [internalOffset, setInternalOffset] = useState(0);

  if (maxVisible == null || items.length <= maxVisible) {
    return (
      <Box flexDirection="column">
        {items.map((item, index) => (
          <React.Fragment key={index}>{render({ item, index })}</React.Fragment>
        ))}
      </Box>
    );
  }

  const maxOffset = Math.max(0, items.length - maxVisible);
  let offset: number;

  if (controlledOffset != null) {
    // Direct offset control (used by Viewport)
    offset = Math.min(controlledOffset, maxOffset);
  } else {
    // Auto-scroll based on highlightIndex (used by Select, etc.)
    offset = Math.min(internalOffset, maxOffset);

    if (highlightIndex != null && highlightIndex >= 0) {
      if (highlightIndex < offset) {
        offset = highlightIndex;
      } else if (highlightIndex >= offset + maxVisible) {
        offset = highlightIndex - maxVisible + 1;
      }
    }

    if (offset !== internalOffset) {
      setInternalOffset(offset);
    }
  }

  const visible = items.slice(offset, offset + maxVisible);

  const paginatorProps = {
    total: items.length,
    offset,
    visible: maxVisible,
    style: paginatorStyle
  };

  if (paginatorStyle === 'scrollbar') {
    return (
      <Box flexDirection="row" gap={1}>
        <Box flexDirection="column">
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
    <Box flexDirection="column">
      <Paginator {...paginatorProps} position="above" />
      {visible.map((item, i) => {
        const index = offset + i;
        return <React.Fragment key={index}>{render({ item, index })}</React.Fragment>;
      })}
      <Paginator {...paginatorProps} position="below" />
    </Box>
  );
}
