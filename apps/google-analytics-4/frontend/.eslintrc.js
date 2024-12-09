module.exports = {
  extends: ['eslint:recommended'],

  root: true,
  env: {
    node: true,
  },
  rules: {
    '@typescript-eslint/ban-types': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
  },
};
