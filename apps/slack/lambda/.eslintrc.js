const path = require('path');

module.exports = {
  extends: [require.resolve('@contentful/eslint-config-extension/typescript')],
  parserOptions: {
    project: path.resolve('tsconfig.json'),
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 0,
  },
};
