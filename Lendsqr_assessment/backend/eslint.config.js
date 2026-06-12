import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { parser, parserOptions: { project: './tsconfig.json' } },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { "argsIgnorePattern": "^_" }]
    }
  }
];
