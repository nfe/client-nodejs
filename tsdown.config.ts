import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Keep readable for debugging
  target: 'node22',
  // Keep the same output names as v3 (tsup): index.js/index.d.ts (ESM) + index.cjs (CJS)
  outExtensions: ({ format }) =>
    format === 'cjs' ? { js: '.cjs', dts: '.d.cts' } : { js: '.js', dts: '.d.ts' },
  // `/*!` marks a legal comment: esbuild and terser keep it when the consumer re-bundles
  // or minifies, so the license notice travels with the code (MIT requires it).
  banner:
    '/*! nfe-io | SPDX-License-Identifier: MIT | Copyright (c) 2026 NFE.IO HUB SERVICOS DE TECNOLOGIA LTDA | https://nfe.io */',
  onSuccess: async () => {
    console.log('✅ Build completed successfully');
  },
});
