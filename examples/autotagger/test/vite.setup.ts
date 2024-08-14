import { configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

configure({
  testIdAttribute: 'data-test-id',
});
