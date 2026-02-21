import { ReactNode, useEffect, useState } from 'react';
import { Box } from 'ink';
import { useTerminalSize } from '../hooks/useTerminalSize';

const isTTY = typeof process !== 'undefined' && process.stdout?.write;

type AlternateScreenProps = {
  children: ReactNode;
  fullScreen?: boolean;
};

export function AlternateScreen({ children, fullScreen = true }: AlternateScreenProps) {
  const [ready, setReady] = useState(!isTTY);
  const { rows, columns } = useTerminalSize();

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

  if (!ready) return null;

  return fullScreen ? (
    <Box height={rows} width={columns}>
      {children}
    </Box>
  ) : (
    <>{children}</>
  );
}
