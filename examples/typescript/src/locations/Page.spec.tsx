import React from 'react';
import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk
}))

describe('Page component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Page cma={mockCma} />);

    expect(getByText('Hello Page Component (AppId: test-app)')).toBeInTheDocument();
  });
});
