import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    '.open-next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.source/**',
    'content/**',
    'public/og/**'
  ])
]);

export default eslintConfig;
