import React, { useReducer, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { GigglesError } from '../core/GigglesError';
import { useFocus } from '../core/focus';
import { useKeybindings } from '../core/input';
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
  maxVisible?: number;
  paginatorStyle?: PaginatorStyle;
  wrap?: boolean;
  render?: (props: AutocompleteRenderProps<T>) => React.ReactNode;
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
  maxVisible,
  paginatorStyle,
  wrap = true,
  render
}: AutocompleteProps<T>) {
  const seen = new Set<string>();
  for (const opt of options) {
    const key = String(opt.value);
    if (seen.has(key)) {
      throw new GigglesError('Autocomplete options must have unique values');
    }
    seen.add(key);
  }

  const focus = useFocus();
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const cursorRef = useRef(0);
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  const filtered = query.length === 0 ? options : options.filter((opt) => filter(query, opt));

  const safeIndex = filtered.length === 0 ? -1 : Math.min(highlightIndex, filtered.length - 1);
  if (safeIndex >= 0 && safeIndex !== highlightIndex) {
    setHighlightIndex(safeIndex);
  }

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
      capture: true,
      passthrough: ['tab', 'shift+tab', 'escape'],
      onKeypress: (input, key) => {
        if (input.length === 1 && !key.ctrl && !key.return && !key.escape && !key.tab) {
          const c = cursorRef.current;
          cursorRef.current = c + 1;
          updateQuery(query.slice(0, c) + input + query.slice(c));
        }
      }
    }
  );

  const before = query.slice(0, cursor);
  const cursorChar = query[cursor] ?? ' ';
  const after = query.slice(cursor + 1);

  const prefix = label != null ? `${label} ` : '';

  return (
    <Box flexDirection="column">
      {focus.focused ? (
        <Text>
          {prefix}
          {before}
          <Text inverse>{cursorChar}</Text>
          {after}
        </Text>
      ) : (
        <Text dimColor>
          {prefix}
          {query.length > 0 ? query : placeholder ?? ''}
        </Text>
      )}
      <VirtualList
        items={filtered}
        highlightIndex={safeIndex}
        maxVisible={maxVisible}
        paginatorStyle={paginatorStyle}
        render={({ item: option, index }) => {
          const highlighted = index === safeIndex;
          const selected = option.value === value;

          if (render) {
            return render({ option, focused: focus.focused, highlighted, selected });
          }

          return (
            <Text dimColor={!focus.focused}>
              {highlighted ? '>' : ' '} {option.label}
            </Text>
          );
        }}
      />
    </Box>
  );
}
