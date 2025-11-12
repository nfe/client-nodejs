module.exports = {  
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General rules
    'no-console': 'off', // Allow console for SDK
    'prefer-const': 'error',
    'no-var': 'error'
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '*.cjs',
    'src/generated/**/*' // Don't lint auto-generated code
  ]
};