import React from 'react';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import Field from '@/components/locations/Field';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component (AppId: test-app)')).toBeInTheDocument();
  });
});
