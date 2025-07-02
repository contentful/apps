import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { mockSdk, mockCma } from '..';
import Sidebar from '../../../src/locations/Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Sidebar component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<Sidebar />);

    await expect(getByText('Hello Sidebar Component (AppId: test-app)')).toBeInTheDocument();
  });
});
