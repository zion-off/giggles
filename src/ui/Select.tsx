import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { GigglesError } from '../core/GigglesError';
import { useFocus } from '../core/focus';
import { useKeybindings } from '../core/input';
import type { PaginatorStyle } from './Paginator';
import { VirtualList } from './VirtualList';

export type SelectOption<T> = {
  label: string;
  value: T;
};

export type SelectRenderProps<T> = {
  option: SelectOption<T>;
  focused: boolean;
  highlighted: boolean;
  selected: boolean;
};

type SelectProps<T> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onSubmit?: (value: T) => void;
  onHighlight?: (value: T) => void;
  label?: string;
  immediate?: boolean;
  direction?: 'vertical' | 'horizontal';
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  wrap?: boolean;
  render?: (props: SelectRenderProps<T>) => React.ReactNode;
};

export function Select<T>({
  options,
  value,
  onChange,
  onSubmit,
  onHighlight,
  label,
  immediate,
  direction = 'vertical',
  maxVisible,
  paginatorStyle,
  wrap = true,
  render
}: SelectProps<T>) {
  const seen = new Set<string>();
  for (const opt of options) {
    const key = String(opt.value);
    if (seen.has(key)) {
      throw new GigglesError('Select options must have unique values');
    }
    seen.add(key);
  }

  const focus = useFocus();
  const [highlightIndex, setHighlightIndex] = useState(0);

  const safeIndex = options.length === 0 ? -1 : Math.min(highlightIndex, options.length - 1);

  useEffect(() => {
    if (safeIndex !== highlightIndex) {
      setHighlightIndex(Math.max(0, safeIndex));
    }
  }, [safeIndex, highlightIndex]);

  const moveHighlight = (delta: number) => {
    if (options.length === 0) return;
    const next = wrap
      ? (safeIndex + delta + options.length) % options.length
      : Math.max(0, Math.min(options.length - 1, safeIndex + delta));
    if (next !== safeIndex) {
      setHighlightIndex(next);
      onHighlight?.(options[next]!.value);
      if (immediate) {
        onChange(options[next]!.value);
      }
    }
  };

  const prev = () => moveHighlight(-1);
  const next = () => moveHighlight(1);

  const navBindings =
    direction === 'vertical'
      ? { j: next, k: prev, down: next, up: prev }
      : { l: next, h: prev, right: next, left: prev };

  useKeybindings(focus, {
    ...navBindings,
    enter: () => {
      if (options.length === 0) return;
      if (immediate) {
        onSubmit?.(options[safeIndex]!.value);
      } else {
        onChange(options[safeIndex]!.value);
        onSubmit?.(options[safeIndex]!.value);
      }
    }
  });

  const isHorizontal = direction === 'horizontal';

  const renderOption = ({ item: option, index }: { item: SelectOption<T>; index: number }) => {
    const highlighted = index === safeIndex;
    const selected = option.value === value;

    if (render) {
      return render({ option, focused: focus.focused, highlighted, selected });
    }

    return (
      <Text key={String(option.value)} dimColor={!focus.focused}>
        {highlighted ? '>' : ' '} {option.label}
      </Text>
    );
  };

  return (
    <Box flexDirection={isHorizontal ? 'row' : 'column'} gap={isHorizontal ? 1 : 0}>
      {label != null && <Text>{label}</Text>}
      {isHorizontal ? (
        options.map((option, index) => (
          <React.Fragment key={String(option.value)}>{renderOption({ item: option, index })}</React.Fragment>
        ))
      ) : (
        <VirtualList
          items={options}
          highlightIndex={safeIndex}
          maxVisible={maxVisible}
          paginatorStyle={paginatorStyle}
          render={renderOption}
        />
      )}
    </Box>
  );
}
