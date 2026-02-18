import { ReactNode, useEffect, useState } from 'react';

const isTTY = typeof process !== 'undefined' && process.stdout?.write;

export function AlternateScreen({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isTTY);

  useEffect(() => {
    if (!isTTY) return;

    process.stdout.write('\x1b[?1049h'); // enter alternate screen
    process.stdout.write('\x1b[2J'); // clear it
    process.stdout.write('\x1b[H'); // home cursor to (0,0)
    setReady(true);

    return () => {
      process.stdout.write('\x1b[?1049l');
    };
  }, []);
  return ready ? <>{children}</> : null;
}
