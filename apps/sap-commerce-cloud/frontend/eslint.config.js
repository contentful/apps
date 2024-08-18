const react = require('eslint-plugin-react'); // eslint-disable-line
const typescriptPlugin = require('@typescript-eslint/eslint-plugin'); // eslint-disable-line
const typescriptParser = require('@typescript-eslint/parser'); // eslint-disable-line
const prettierConfig = require('eslint-config-prettier'); // eslint-disable-line
const prettierPlugin = require('eslint-plugin-prettier'); // eslint-disable-line

const config = [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      react,
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'prettier/prettier': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Prettier configuration
    ...prettierConfig,
  },
];

module.exports = config;
