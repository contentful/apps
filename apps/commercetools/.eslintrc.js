const path = require("path");

module.exports = {
  extends: [
    require.resolve("@contentful/eslint-config-extension/typescript"),
    require.resolve("@contentful/eslint-config-extension/jest"),
    require.resolve("@contentful/eslint-config-extension/jsx-a11y"),
    require.resolve("@contentful/eslint-config-extension/react")
  ],
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    project: path.resolve("tsconfig.json")
  },
  rules: {
    "you-dont-need-lodash-underscore/omit": "off",
    "you-dont-need-lodash-underscore/uniq": "off"
  }
};
