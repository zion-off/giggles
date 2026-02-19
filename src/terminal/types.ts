export type TerminalSize = {
  rows: number;
  columns: number;
};

export type ShellOutHandle = {
  run: (command: string) => Promise<void>;
};
