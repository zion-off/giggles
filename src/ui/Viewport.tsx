import React, {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { Box, DOMElement, measureElement } from 'ink';
import { useFocusNode } from '../core/focus';
import { useKeybindings } from '../core/input';

function MeasurableItem({
  children,
  index,
  onMeasure
}: {
  children: React.ReactNode;
  index: number;
  onMeasure: (index: number, height: number) => void;
}) {
  const ref = useRef<DOMElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const { height } = measureElement(ref.current);
      onMeasure(index, height);
    }
  }, [index, onMeasure, children]);

  return (
    <Box ref={ref} flexShrink={0} width="100%" flexDirection="column">
      {children}
    </Box>
  );
}

export type ViewportRef = {
  scrollTo: (offset: number) => void;
  scrollBy: (delta: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollToItem: (index: number) => void;
  getScrollOffset: () => number;
  getContentHeight: () => number;
  getViewportHeight: () => number;
};

type ViewportProps = {
  children?: React.ReactNode;
  height: number;
  keybindings?: boolean;
  footer?: React.ReactNode;
};

export const Viewport = forwardRef<ViewportRef, ViewportProps>(function Viewport(
  { children, height, keybindings: enableKeybindings = true, footer },
  ref
) {
  const focus = useFocusNode();
  const [scrollOffset, setScrollOffset] = useState(0);

  const contentHeightRef = useRef(0);
  const itemHeightsRef = useRef<Record<string | number, number>>({});
  const itemKeysRef = useRef<(string | number)[]>([]);
  const scrollOffsetRef = useRef(0);
  scrollOffsetRef.current = scrollOffset;

  // Track child keys for height mapping
  const childKeys: (string | number)[] = [];
  Children.forEach(children, (child, index) => {
    if (!child) return;
    const key = isValidElement(child) ? child.key : null;
    childKeys[index] = key !== null ? key : index;
  });
  itemKeysRef.current = childKeys;

  const getMaxOffset = useCallback(() => Math.max(0, contentHeightRef.current - height), [height]);

  const clampAndSetOffset = useCallback(
    (offset: number) => {
      const clamped = Math.max(0, Math.min(offset, getMaxOffset()));
      setScrollOffset(clamped);
    },
    [getMaxOffset]
  );

  const handleItemMeasure = useCallback(
    (index: number, measuredHeight: number) => {
      const key = itemKeysRef.current[index] ?? index;
      if (itemHeightsRef.current[key] === measuredHeight) return;

      itemHeightsRef.current[key] = measuredHeight;

      let total = 0;
      for (const k of itemKeysRef.current) {
        total += itemHeightsRef.current[k] ?? 0;
      }
      contentHeightRef.current = total;

      // Re-clamp if content shrank below current offset
      const maxOffset = Math.max(0, total - height);
      if (scrollOffsetRef.current > maxOffset) {
        setScrollOffset(maxOffset);
      }
    },
    [height]
  );

  const getItemTop = useCallback((index: number): number => {
    let top = 0;
    for (let i = 0; i < index && i < itemKeysRef.current.length; i++) {
      const key = itemKeysRef.current[i] ?? i;
      top += itemHeightsRef.current[key] ?? 0;
    }
    return top;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (offset: number) => clampAndSetOffset(offset),
      scrollBy: (delta: number) => clampAndSetOffset(scrollOffsetRef.current + delta),
      scrollToTop: () => setScrollOffset(0),
      scrollToBottom: () => setScrollOffset(getMaxOffset()),
      scrollToItem: (index: number) => {
        const itemTop = getItemTop(index);
        const key = itemKeysRef.current[index] ?? index;
        const itemHeight = itemHeightsRef.current[key] ?? 0;
        const itemBottom = itemTop + itemHeight;
        const current = scrollOffsetRef.current;

        if (itemTop < current) {
          // Item is above the viewport — scroll up to show it at top
          clampAndSetOffset(itemTop);
        } else if (itemBottom > current + height) {
          // Item is below the viewport — scroll down to show it at bottom
          clampAndSetOffset(itemBottom - height);
        }
      },
      getScrollOffset: () => scrollOffsetRef.current,
      getContentHeight: () => contentHeightRef.current,
      getViewportHeight: () => height
    }),
    [clampAndSetOffset, getMaxOffset, getItemTop, height]
  );

  useKeybindings(
    focus,
    enableKeybindings
      ? {
          j: () => clampAndSetOffset(scrollOffsetRef.current + 1),
          k: () => clampAndSetOffset(scrollOffsetRef.current - 1),
          down: () => clampAndSetOffset(scrollOffsetRef.current + 1),
          up: () => clampAndSetOffset(scrollOffsetRef.current - 1),
          pagedown: () => clampAndSetOffset(scrollOffsetRef.current + height),
          pageup: () => clampAndSetOffset(scrollOffsetRef.current - height),
          g: () => setScrollOffset(0),
          G: () => setScrollOffset(getMaxOffset())
        }
      : {}
  );

  return (
    <Box flexDirection="column">
      <Box height={height} overflow="hidden">
        <Box marginTop={-scrollOffset} flexDirection="column" width="100%">
          {Children.map(children, (child, index) => {
            if (!child) return null;
            return (
              <MeasurableItem
                key={isValidElement(child) ? child.key ?? index : index}
                index={index}
                onMeasure={handleItemMeasure}
              >
                {child}
              </MeasurableItem>
            );
          })}
        </Box>
      </Box>
      {footer}
    </Box>
  );
});
