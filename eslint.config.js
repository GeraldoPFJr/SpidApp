import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: await import('typescript-eslint').then((m) => m.default.parser),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**'],
  },
]
