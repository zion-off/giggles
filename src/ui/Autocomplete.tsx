import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { GigglesError } from '../core/GigglesError';
import { useFocusNode } from '../core/focus';
import { useKeybindings } from '../core/input';
import { useTheme } from '../core/theme';
import type { PaginatorStyle } from './Paginator';
import type { SelectOption } from './Select';
import { VirtualList } from './VirtualList';

export type AutocompleteRenderProps<T> = {
  option: SelectOption<T>;
  focused: boolean;
  highlighted: boolean;
  selected: boolean;
};

type AutocompleteProps<T> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onSubmit?: (value: T) => void;
  onHighlight?: (value: T) => void;
  label?: string;
  placeholder?: string;
  filter?: (query: string, option: SelectOption<T>) => boolean;
  gap?: number;
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  wrap?: boolean;
  render?: (props: AutocompleteRenderProps<T>) => React.ReactNode;
  focusKey?: string;
};

function defaultFilter<T>(query: string, option: SelectOption<T>): boolean {
  const caseSensitive = query !== query.toLowerCase();
  if (caseSensitive) {
    return option.label.includes(query);
  }
  return option.label.toLowerCase().includes(query);
}

export function Autocomplete<T>({
  options,
  value,
  onChange,
  onSubmit,
  onHighlight,
  label,
  placeholder,
  filter = defaultFilter,
  gap,
  maxVisible,
  paginatorStyle,
  wrap = true,
  render,
  focusKey
}: AutocompleteProps<T>) {
  const seen = new Set<string>();
  for (const opt of options) {
    const key = String(opt.value);
    if (seen.has(key)) {
      throw new GigglesError('Autocomplete options must have unique values');
    }
    seen.add(key);
  }

  const focus = useFocusNode({ focusKey });
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const cursorRef = useRef(0);
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  const filtered = useMemo(
    () => (query.length === 0 ? options : options.filter((opt) => filter(query, opt))),
    [options, query, filter]
  );

  const safeIndex = filtered.length === 0 ? -1 : Math.min(highlightIndex, filtered.length - 1);

  useEffect(() => {
    if (safeIndex >= 0 && safeIndex !== highlightIndex) {
      setHighlightIndex(safeIndex);
    }
  }, [safeIndex, highlightIndex]);

  const cursor = Math.min(cursorRef.current, query.length);
  cursorRef.current = cursor;

  const moveHighlight = (delta: number) => {
    if (filtered.length === 0) return;
    const next = wrap
      ? (safeIndex + delta + filtered.length) % filtered.length
      : Math.max(0, Math.min(filtered.length - 1, safeIndex + delta));
    if (next !== safeIndex) {
      setHighlightIndex(next);
      onHighlight?.(filtered[next]!.value);
    }
  };

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
    setHighlightIndex(0);
  };

  useKeybindings(
    focus,
    {
      up: () => moveHighlight(-1),
      down: () => moveHighlight(1),
      left: () => {
        cursorRef.current = Math.max(0, cursorRef.current - 1);
        forceRender();
      },
      right: () => {
        cursorRef.current = Math.min(query.length, cursorRef.current + 1);
        forceRender();
      },
      home: () => {
        cursorRef.current = 0;
        forceRender();
      },
      end: () => {
        cursorRef.current = query.length;
        forceRender();
      },
      backspace: () => {
        const c = cursorRef.current;
        if (c > 0) {
          cursorRef.current = c - 1;
          updateQuery(query.slice(0, c - 1) + query.slice(c));
        }
      },
      delete: () => {
        const c = cursorRef.current;
        if (c < query.length) {
          updateQuery(query.slice(0, c) + query.slice(c + 1));
        }
      },
      enter: () => {
        if (filtered.length === 0) return;
        const selected = filtered[safeIndex]!.value;
        onChange(selected);
        onSubmit?.(selected);
      }
    },
    {
      fallback: (input, key) => {
        if (input.length === 1 && !key.ctrl && !key.return && !key.escape && !key.tab) {
          const c = cursorRef.current;
          cursorRef.current = c + 1;
          updateQuery(query.slice(0, c) + input + query.slice(c));
        }
      },
      bubble: ['tab', 'shift+tab', 'escape']
    }
  );

  const before = query.slice(0, cursor);
  const cursorChar = query[cursor] ?? ' ';
  const after = query.slice(cursor + 1);

  return (
    <Box flexDirection="column" gap={1}>
      {focus.hasFocus ? (
        <Text>
          {label != null && <Text bold>{label} </Text>}
          {before}
          <Text inverse>{cursorChar}</Text>
          {after}
        </Text>
      ) : (
        <Text dimColor>
          {label != null && <Text>{label} </Text>}
          {query.length > 0 ? query : placeholder ?? ''}
        </Text>
      )}
      <VirtualList
        items={filtered}
        highlightIndex={safeIndex}
        gap={gap}
        maxVisible={maxVisible}
        paginatorStyle={paginatorStyle}
        render={({ item: option, index }) => {
          const highlighted = index === safeIndex;
          const selected = option.value === value;

          if (render) {
            return render({ option, focused: focus.hasFocus, highlighted, selected });
          }

          const active = highlighted && focus.hasFocus;

          return (
            <Box>
              <Text dimColor={!focus.hasFocus && !highlighted}>
                <Text color={active ? theme.accentColor : undefined} bold={highlighted}>
                  {option.label}
                </Text>
              </Text>
            </Box>
          );
        }}
      />
    </Box>
  );
}
