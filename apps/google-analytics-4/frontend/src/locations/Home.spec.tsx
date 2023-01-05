import React from 'react';
import Home from './Home';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Home component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Home />);

    expect(getByText('Hello Home Component (AppId: test-app)')).toBeInTheDocument();
  });
});
