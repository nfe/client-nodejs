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
  banner: '// NFE.io SDK - https://nfe.io',
  onSuccess: async () => {
    console.log('✅ Build completed successfully');
  },
});
