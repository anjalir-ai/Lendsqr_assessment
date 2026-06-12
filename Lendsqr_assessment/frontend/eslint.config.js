import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser, parserOptions: { project: './tsconfig.json' } },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
];
