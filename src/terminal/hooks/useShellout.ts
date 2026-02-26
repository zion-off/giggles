import { execa } from 'execa';
import { useCallback, useState } from 'react';
import { useStdin } from 'ink';
import type { ShellOutHandle } from '../types';

export function useShellOut(): ShellOutHandle {
  const [, setRedrawCount] = useState(0);
  const { setRawMode } = useStdin();

  const run = useCallback(
    async (command: string) => {
      process.stdout.write('\x1b[?1049l');
      setRawMode(false);

      try {
        const result = await execa(command, { stdio: 'inherit', shell: true, reject: false });
        return { exitCode: result.exitCode ?? 0 };
      } finally {
        setRawMode(true);
        process.stdout.write('\x1b[?1049h');
        process.stdout.write('\x1b[2J');
        process.stdout.write('\x1b[H');
        setRedrawCount((c) => c + 1);
      }
    },
    [setRawMode]
  );

  return {
    run
  };
}
