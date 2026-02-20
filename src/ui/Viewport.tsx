import React, { useState } from 'react';
import { Text } from 'ink';
import { useFocus } from '../core/focus';
import { useKeybindings } from '../core/input';
import type { PaginatorStyle } from './Paginator';
import { VirtualList } from './VirtualList';

export type ViewportRenderProps<T> = {
  item: T;
  index: number;
  focused: boolean;
};

type ViewportProps<T> = {
  items: T[];
  maxVisible: number;
  showLineNumbers?: boolean;
  paginatorStyle?: PaginatorStyle;
  render?: (props: ViewportRenderProps<T>) => React.ReactNode;
};

export function Viewport<T>({ items, maxVisible, showLineNumbers, paginatorStyle, render }: ViewportProps<T>) {
  const focus = useFocus();
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxOffset = Math.max(0, items.length - maxVisible);

  const scroll = (delta: number) => {
    setScrollOffset((prev) => Math.max(0, Math.min(maxOffset, prev + delta)));
  };

  useKeybindings(focus, {
    j: () => scroll(1),
    k: () => scroll(-1),
    down: () => scroll(1),
    up: () => scroll(-1),
    pagedown: () => scroll(maxVisible),
    pageup: () => scroll(-maxVisible),
    g: () => setScrollOffset(0),
    G: () => setScrollOffset(maxOffset)
  });

  const gutterWidth = showLineNumbers ? String(items.length).length + 1 : 0;

  return (
    <VirtualList
      items={items}
      scrollOffset={scrollOffset}
      maxVisible={maxVisible}
      paginatorStyle={paginatorStyle}
      render={({ item, index }) => {
        if (render) {
          return render({ item, index, focused: focus.focused });
        }
        return (
          <Text dimColor={!focus.focused}>
            {showLineNumbers && <Text dimColor>{String(index + 1).padStart(gutterWidth - 1)} </Text>}
            {String(item)}
          </Text>
        );
      }}
    />
  );
}
