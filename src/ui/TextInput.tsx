import React, { useReducer, useRef } from 'react';
import { Text } from 'ink';
import { useFocusNode } from '../core/focus';
import { useKeybindings } from '../core/input';

export type TextInputRenderProps = {
  value: string;
  focused: boolean;
  before: string;
  cursorChar: string;
  after: string;
};

type TextInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  render?: (props: TextInputRenderProps) => React.ReactNode;
};

export function TextInput({ label, value, onChange, onSubmit, placeholder, render }: TextInputProps) {
  const focus = useFocusNode();
  const cursorRef = useRef(value.length);
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  const cursor = Math.min(cursorRef.current, value.length);
  cursorRef.current = cursor;

  useKeybindings(
    focus,
    {
      left: () => {
        cursorRef.current = Math.max(0, cursorRef.current - 1);
        forceRender();
      },
      right: () => {
        cursorRef.current = Math.min(value.length, cursorRef.current + 1);
        forceRender();
      },
      home: () => {
        cursorRef.current = 0;
        forceRender();
      },
      end: () => {
        cursorRef.current = value.length;
        forceRender();
      },
      backspace: () => {
        const c = cursorRef.current;
        if (c > 0) {
          cursorRef.current = c - 1;
          onChange(value.slice(0, c - 1) + value.slice(c));
        }
      },
      delete: () => {
        const c = cursorRef.current;
        if (c < value.length) {
          onChange(value.slice(0, c) + value.slice(c + 1));
        }
      },
      ...(onSubmit && { enter: () => onSubmit(value) })
    },
    {
      capture: true,
      passthrough: ['tab', 'shift+tab', 'enter', 'escape'],
      onKeypress: (input, key) => {
        if (input.length === 1 && !key.ctrl && !key.return && !key.escape && !key.tab) {
          const c = cursorRef.current;
          cursorRef.current = c + 1;
          onChange(value.slice(0, c) + input + value.slice(c));
        }
      }
    }
  );

  const before = value.slice(0, cursor);
  const cursorChar = value[cursor] ?? ' ';
  const after = value.slice(cursor + 1);

  if (render) {
    return <>{render({ value, focused: focus.hasFocus, before, cursorChar, after })}</>;
  }

  const displayValue = value.length > 0 ? value : placeholder ?? '';
  const isPlaceholder = value.length === 0;

  if (focus.hasFocus) {
    return (
      <Text>
        {label != null && <Text bold>{label} </Text>}
        {before}
        <Text inverse>{cursorChar}</Text>
        {after}
      </Text>
    );
  }

  return (
    <Text dimColor>
      {label != null && <Text>{label} </Text>}
      {isPlaceholder ? <Text dimColor>{displayValue}</Text> : displayValue}
    </Text>
  );
}
