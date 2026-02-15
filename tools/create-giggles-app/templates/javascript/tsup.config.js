import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.jsx'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  external: ['react', 'ink']
});
