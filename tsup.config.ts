import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node16',
  clean: true,
  dts: true,
  external: ['react', 'ink']
});
