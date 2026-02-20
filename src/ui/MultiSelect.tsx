import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { GigglesError } from '../core/GigglesError';
import { useFocus } from '../core/focus';
import { useKeybindings } from '../core/input';
import type { PaginatorStyle } from './Paginator';
import type { SelectOption } from './Select';
import { VirtualList } from './VirtualList';

export type MultiSelectRenderProps<T> = {
  option: SelectOption<T>;
  focused: boolean;
  highlighted: boolean;
  selected: boolean;
};

type MultiSelectProps<T> = {
  options: SelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  onSubmit?: (value: T[]) => void;
  onHighlight?: (value: T) => void;
  label?: string;
  direction?: 'vertical' | 'horizontal';
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  wrap?: boolean;
  render?: (props: MultiSelectRenderProps<T>) => React.ReactNode;
};

export function MultiSelect<T>({
  options,
  value,
  onChange,
  onSubmit,
  onHighlight,
  label,
  direction = 'vertical',
  maxVisible,
  paginatorStyle,
  wrap = true,
  render
}: MultiSelectProps<T>) {
  const seen = new Set<string>();
  for (const opt of options) {
    const key = String(opt.value);
    if (seen.has(key)) {
      throw new GigglesError('MultiSelect options must have unique values');
    }
    seen.add(key);
  }

  const focus = useFocus();
  const [highlightIndex, setHighlightIndex] = useState(0);

  const safeIndex = options.length === 0 ? -1 : Math.min(highlightIndex, options.length - 1);
  if (safeIndex !== highlightIndex) {
    setHighlightIndex(Math.max(0, safeIndex));
  }

  const moveHighlight = (delta: number) => {
    if (options.length === 0) return;
    const next = wrap
      ? (safeIndex + delta + options.length) % options.length
      : Math.max(0, Math.min(options.length - 1, safeIndex + delta));
    if (next !== safeIndex) {
      setHighlightIndex(next);
      onHighlight?.(options[next]!.value);
    }
  };

  const toggle = () => {
    if (options.length === 0) return;
    const item = options[safeIndex]!.value;
    const exists = value.includes(item);
    onChange(exists ? value.filter((v) => v !== item) : [...value, item]);
  };

  const prev = () => moveHighlight(-1);
  const next = () => moveHighlight(1);

  const navBindings =
    direction === 'vertical'
      ? { j: next, k: prev, down: next, up: prev }
      : { l: next, h: prev, right: next, left: prev };

  useKeybindings(focus, {
    ...navBindings,
    ' ': toggle,
    ...(onSubmit && { enter: () => onSubmit(value) })
  });

  const isHorizontal = direction === 'horizontal';

  const renderOption = ({ item: option, index }: { item: SelectOption<T>; index: number }) => {
    const highlighted = index === safeIndex;
    const selected = value.includes(option.value);

    if (render) {
      return render({ option, focused: focus.focused, highlighted, selected });
    }

    return (
      <Text key={String(option.value)} dimColor={!focus.focused}>
        {highlighted ? '>' : ' '} [{selected ? 'x' : ' '}] {option.label}
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
