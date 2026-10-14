import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';

// Modeled on apps/auto-prefix (the repo's ESLint 9 flat-config reference),
// plus react-hooks: this app is orchestrated almost entirely through
// useCallback/useMemo, so exhaustive-deps is the lint rule most likely to
// catch a real bug here.
export default defineConfig([
  globalIgnores(['**/build/']),
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  {
    // The seed/upload scripts run under Node, not the browser.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat['recommended-latest'],
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // The automatic JSX runtime makes React imports unnecessary.
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      // unused-imports subsumes the base rule and can auto-fix removals.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
