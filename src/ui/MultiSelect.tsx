import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { GigglesError } from '../core/GigglesError';
import { useFocusNode } from '../core/focus';
import { useKeybindings } from '../core/input';
import { useTheme } from '../core/theme';
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
  value?: T[];
  onChange?: (value: T[]) => void;
  onSubmit?: (value: T[]) => void;
  onHighlight?: (value: T) => void;
  label?: string;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  wrap?: boolean;
  render?: (props: MultiSelectRenderProps<T>) => React.ReactNode;
  focusKey?: string;
};

export function MultiSelect<T>({
  options,
  value,
  onChange,
  onSubmit,
  onHighlight,
  label,
  direction = 'vertical',
  gap,
  maxVisible,
  paginatorStyle,
  wrap = true,
  render,
  focusKey
}: MultiSelectProps<T>) {
  const seen = new Set<string>();
  for (const opt of options) {
    const key = String(opt.value);
    if (seen.has(key)) {
      throw new GigglesError('MultiSelect options must have unique values');
    }
    seen.add(key);
  }

  const focus = useFocusNode({ focusKey });
  const theme = useTheme();
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [internalSelected, setInternalSelected] = useState<T[]>([]);
  const effectiveValue = value ?? internalSelected;
  const effectiveOnChange = onChange ?? setInternalSelected;

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
    }
  };

  const toggle = () => {
    if (options.length === 0) return;
    const item = options[safeIndex]!.value;
    const exists = effectiveValue.includes(item);
    effectiveOnChange(exists ? effectiveValue.filter((v) => v !== item) : [...effectiveValue, item]);
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
    ...(onSubmit && { enter: () => onSubmit(effectiveValue) })
  });

  const isHorizontal = direction === 'horizontal';

  const renderOption = ({ item: option, index }: { item: SelectOption<T>; index: number }) => {
    const highlighted = index === safeIndex;
    const selected = effectiveValue.includes(option.value);

    if (render) {
      return render({ option, focused: focus.hasFocus, highlighted, selected });
    }

    const active = highlighted && focus.hasFocus;

    return (
      <Box key={String(option.value)}>
        <Text dimColor={!focus.hasFocus && !highlighted}>
          <Text color={selected ? theme.selectedColor : undefined} bold={selected}>
            {selected ? theme.checkedIndicator : theme.uncheckedIndicator}
          </Text>{' '}
          <Text color={active ? theme.accentColor : undefined} bold={highlighted}>
            {option.label}
          </Text>
        </Text>
      </Box>
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
          gap={gap}
          maxVisible={maxVisible}
          paginatorStyle={paginatorStyle}
          render={renderOption}
        />
      )}
    </Box>
  );
}
