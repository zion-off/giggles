import type { SpawnOptionsWithoutStdio } from 'child_process';

export type TerminalSize = {
  rows: number;
  columns: number;
};

export type ShellOutHandle = {
  run: (command: string) => Promise<void>;
};

export type SpawnOptions = SpawnOptionsWithoutStdio & {
  /**
   * Inject FORCE_COLOR=1 and TERM=xterm-256color into the child process
   * environment so tools that detect isTTY emit ANSI color codes.
   */
  pty?: boolean;
};

export type SpawnOutputLine = {
  type: 'stdout' | 'stderr';
  data: string;
};

export type SpawnHandle = {
  output: SpawnOutputLine[];
  running: boolean;
  exitCode: number | null;
  error: Error | null;
  run: (command: string, args?: string[], options?: SpawnOptions) => void;
  kill: () => void;
};
