import { useEffect, useState } from 'react';
import type { TerminalSize } from '../types';

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>({
    rows: process.stdout.rows,
    columns: process.stdout.columns
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        rows: process.stdout.rows,
        columns: process.stdout.columns
      });
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return size;
}
