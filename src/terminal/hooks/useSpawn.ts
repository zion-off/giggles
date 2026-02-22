import { spawn } from 'child_process';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpawnHandle, SpawnOptions, SpawnOutputLine } from '../types';

export function useSpawn(): SpawnHandle {
  const [output, setOutput] = useState<SpawnOutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const processRef = useRef<ReturnType<typeof spawn> | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      processRef.current?.kill();
    };
  }, []);

  const run = useCallback((command: string, args?: string[], options?: SpawnOptions) => {
    cancelRef.current?.();
    processRef.current?.kill();
    processRef.current = null;
    cancelRef.current = null;

    let cancelled = false;
    cancelRef.current = () => {
      cancelled = true;
    };

    const { pty, ...spawnOptions } = options ?? {};

    setOutput([]);
    setRunning(true);
    setExitCode(null);
    setError(null);

    const env = pty
      ? { ...process.env, FORCE_COLOR: '1', TERM: 'xterm-256color', ...spawnOptions.env }
      : { ...process.env, ...spawnOptions.env };

    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(command, args ?? [], { ...spawnOptions, env, stdio: 'pipe' });
    } catch (err) {
      setRunning(false);
      setError(err instanceof Error ? err : new Error(String(err)));
      cancelRef.current = null;
      return;
    }
    processRef.current = proc;

    // stdio: 'pipe' is enforced above so stdout/stderr are always Readable
    proc.stdout!.on('data', (data: Buffer) => {
      if (!cancelled) setOutput((prev) => [...prev, { type: 'stdout', data: data.toString() }]);
    });

    proc.stderr!.on('data', (data: Buffer) => {
      if (!cancelled) setOutput((prev) => [...prev, { type: 'stderr', data: data.toString() }]);
    });

    proc.on('error', (err) => {
      if (!cancelled) {
        cancelled = true; // prevent the subsequent close event from overwriting error state
        setError(err);
        setRunning(false);
        processRef.current = null;
        cancelRef.current = null;
      }
    });

    proc.on('close', (code: number | null) => {
      if (!cancelled) {
        setRunning(false);
        setExitCode(code);
        processRef.current = null;
        cancelRef.current = null;
      }
    });
  }, []);

  const kill = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    processRef.current?.kill();
    processRef.current = null;
    setRunning(false);
  }, []);

  return { output, running, exitCode, error, run, kill };
}
