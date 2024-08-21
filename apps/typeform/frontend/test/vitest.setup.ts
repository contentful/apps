import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-test-id' });
