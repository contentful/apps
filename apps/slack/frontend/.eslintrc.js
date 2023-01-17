const path = require('path');

module.exports = {
  extends: [
    require.resolve('@contentful/eslint-config-extension/typescript'),
    require.resolve('@contentful/eslint-config-extension/jest'),
    require.resolve('@contentful/eslint-config-extension/jsx-a11y'),
  ],
  rules: {
    'react/no-unused-prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  parserOptions: {
    project: path.resolve('tsconfig.json'),
  },
};
