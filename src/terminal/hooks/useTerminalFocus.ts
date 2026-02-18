import { useEffect, useRef } from 'react';

export function useTerminalFocus(callback: (focused: boolean) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: Buffer) => {
      const str = data.toString();
      if (str.includes('\x1b[I')) callbackRef.current(true);
      if (str.includes('\x1b[O')) callbackRef.current(false);
    };

    process.stdin.on('data', handler);

    // Defer enabling focus reporting until after Ink's current render cycle,
    // so the terminal's immediate \x1b[I response doesn't interleave with output.
    const timer = setTimeout(() => {
      process.stdout.write('\x1b[?1004h');
    }, 0);

    return () => {
      clearTimeout(timer);
      process.stdout.write('\x1b[?1004l');
      process.stdin.off('data', handler);
    };
  }, []);
}
