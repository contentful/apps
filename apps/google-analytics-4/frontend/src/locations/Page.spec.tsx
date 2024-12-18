import React from 'react';
import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeInTheDocument();
  });
});
