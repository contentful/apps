import React from 'react';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import Page from '@/components/locations/Page';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeInTheDocument();
  });
});
