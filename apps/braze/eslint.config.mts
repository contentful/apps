// apps/my-app/eslint.config.js

import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config.mts';

export default defineConfig([
  ...rootConfig,
  {
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]);
