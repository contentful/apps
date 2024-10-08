module.exports = {
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/iframe-has-title': 'warn',
    'jsx-a11y/no-noninteractive-tabindex': 'warn',
    'jsx-a11y/tabindex-no-positive': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/interactive-supports-focus': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/no-redundant-roles': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    'jsx-a11y/img-redundant-alt': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/aria-role': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
  },
  meta: {
    name: '@contentful/eslint-plugin-contentful-apps',
  },
};
