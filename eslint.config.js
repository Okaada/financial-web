import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Guard the "single HTTP client" rule (design.md, D2): nothing outside
      // src/api/client.ts may call fetch directly.
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Use the HTTP client in src/api/client.ts instead of calling fetch directly.' }],
    },
  },
  {
    // The HTTP client is the one allowed place to call fetch.
    files: ['src/api/client.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
)
