import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Keep readable for debugging
  target: 'node18',
  esbuildOptions: (options) => {
    options.banner = {
      js: '// NFE.io SDK v3 - https://nfe.io',
    };
  },
  onSuccess: async () => {
    console.log('✅ Build completed successfully');
  },
});
