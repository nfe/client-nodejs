import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Restrito a tests/: o glob '**/*' atravessava os symlinks client-php/
    // client-ruby (que apontam de volta para este repo), coletando os mesmos
    // testes 3-4x e corrompendo o .test-temp compartilhado (flake).
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    // O `--typecheck` só confere os arquivos do programa do TypeScript. O tsconfig.json inclui só
    // src/, então os tests/types/*.test-d.ts ficavam de fora e nenhum erro de tipo aparecia (uma
    // asserção falsa passava). Este tsconfig inclui os testes de tipo.
    typecheck: {
      tsconfig: './tsconfig.test-types.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/generated/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
        'scripts/',
        'examples/',
        'tests/'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    setupFiles: ['./tests/setup.ts']
  }
});
