import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/terminal/index.ts', 'src/ui/index.ts', 'src/markdown/index.ts'],
  format: ['esm'],
  target: 'node16',
  clean: true,
  dts: true,
  splitting: true,
  external: ['react', 'ink']
});
